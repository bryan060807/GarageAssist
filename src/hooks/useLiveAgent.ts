import { useState, useRef, useEffect, useCallback } from 'react';
import { getAi } from '../lib/geminiAgent';
import { LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { float32To16BitPCM, base64EncodeAudio, AudioStreamStreamer } from '../lib/audioUtils';
import { useAppStore } from '../store/useAppStore';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Define the voice name to use
type VoiceName = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';

export function useLiveAgent() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [agentResponse, setAgentResponse] = useState<string | null>(null);
  const [userTranscript, setUserTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const sessionRef = useRef<any>(null);
  const audioStreamerRef = useRef<AudioStreamStreamer | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  
  const { user, profile, vehicles, reports, diagnostics } = useAppStore();
  const navigate = useNavigate();

  const selectedVoice = 'Zephyr';

  const connect = useCallback(async () => {
    if (isConnected || isConnecting) return;
    setIsConnecting(true);
    setError(null);
    try {
      const ai = getAi();
      
      let stream: MediaStream;
      try {
        const audioConstraints = useAppStore.getState().greaseMode ? {
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: true,
          channelCount: 1,
        } : true;
        
        stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
      } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.message?.includes('not allowed by the user agent')) {
          throw new Error("Microphone access is blocked. Please open the app in a new tab (click the ↗️ icon) to use Voice Assistant.");
        }
        if (err.name === 'NotFoundError' || err.message?.includes('The object can not be found')) {
          throw new Error("No microphone found. Please connect a microphone to use Voice Assistant.");
        }
        throw err;
      }
      streamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;
      
      audioStreamerRef.current = new AudioStreamStreamer(24000);

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      
      const changeSettingsDecl: FunctionDeclaration = {
        name: "changeSettings",
        description: "Change application preferences",
        parameters: {
          type: Type.OBJECT,
          properties: {
            units: { type: Type.STRING, description: "imperial or metric" },
            defaultWastePercent: { type: Type.NUMBER }
          }
        }
      };
      
      const executeActionDecl: FunctionDeclaration = {
        name: "executeAction",
        description: "Execute a generic action in the UI, like saving, computing, generating PDF, or navigating.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            action: { type: Type.STRING, description: "One of: analyze_photo, save_diagnostic, navigate_vehicles, navigate_diagnostics, navigate_inspections, navigate_parts, navigate_reports, scroll_down, scroll_up, replay_step, log_note" },
            text: { type: Type.STRING, description: "Optional text parameter for actions like log_note" }
          },
          required: ["action"]
        }
      };

      const searchKnowledgeBankDecl: FunctionDeclaration = {
        name: "searchKnowledgeBank",
        description: "Search the local knowledge bank (documents, plans, references)",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: { type: Type.STRING, description: "The search query" }
          },
          required: ["query"]
        }
      };

      const postMessageDecl: FunctionDeclaration = {
        name: "postMessage",
        description: "Post a message to the company-wide chat or message board",
        parameters: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING, description: "The content of the message" }
          },
          required: ["text"]
        }
      };

      const systemInstruction = `You are 'GarageAssist Intelligence', a highly sophisticated and responsive AI Mechanic Assistant.
Your primary directive is to provide mission-critical automotive support and diagnostics.
Identity: You are the digital backbone of the garage. Your tone is professional, technical, authoritative, and helpful.
Operational Context:
- Current Mechanic: ${profile?.displayName} (Role: ${profile?.role})
- Safety Protocol: Always prioritize vehicle safety and proper torque specs.
- Hands-Free Grease Mode: ${useAppStore.getState().greaseMode ? "ON. You must apply strict voice scraping. Ignore ALL ambient noise (impact wrenches, background chat) and listen only for explicit commands like 'Scroll Down', 'Read Next Step', 'Log Note'. Skip small talk, just report success or read the text to the mechanic." : "OFF. Normal conversational mode."}

Capabilities:
1. Diagnostics: Decode OBD2 codes and provide potential symptoms and fixes.
2. Step-by-step Guides: Offer detailed repair instructions. Include EXACT Fastener Torque Memory (e.g. lb-ft) and Component-Specific Position Mapping (e.g. orientation for reassembly).
3. Chat/Message: Post messages to the garage board.
4. UI Control: Use executeAction for executing 'scroll_down', 'scroll_up', 'replay_step', 'log_note'.`;

      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview", // Required model for Live API
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } },
          },
          systemInstruction,
          tools: [
            { googleSearch: {} },
            { functionDeclarations: [
              changeSettingsDecl, 
              executeActionDecl, 
              searchKnowledgeBankDecl,
              postMessageDecl
            ] }
          ],
          inputAudioTranscription: {  },
          outputAudioTranscription: {  }
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);
            
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcm16 = float32To16BitPCM(inputData);
              const base64Data = base64EncodeAudio(pcm16);
              sessionPromise.then(session => {
                session.sendRealtimeInput({
                  audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                });
              });
            };

            source.connect(processor);
            processor.connect(audioCtx.destination);
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            disconnect();
          },
          onclose: () => {
            disconnect();
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.interrupted) {
              audioStreamerRef.current?.stop();
            }

            const modelTurn = message.serverContent?.modelTurn;
            if (modelTurn) {
              for (const part of modelTurn.parts) {
                if (part.inlineData && part.inlineData.data) {
                  audioStreamerRef.current?.playBase64(part.inlineData.data);
                }
                if (part.text) {
                   setAgentResponse(prev => (prev ? prev + " " + part.text : part.text));
                }
              }
            }

            // Handle tool calls
            const toolCalls = message.toolCall?.functionCalls;
            if (toolCalls && toolCalls.length > 0) {
              const functionResponses = [];
              for (const call of toolCalls) {
                let responseData = {};
                try {
                  const args = call.args as any;
                  if (call.name === 'changeSettings') {
                    // updatePreferences(args);
                    navigate('/settings');
                    responseData = { success: true };
                  } else if (call.name === 'executeAction') {
                    if (args.action === 'save_diagnostic') window.dispatchEvent(new Event('voice-save'));
                    else if (args.action === 'analyze_photo') window.dispatchEvent(new Event('voice-analyze'));
                    else if (args.action === 'scroll_down') window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
                    else if (args.action === 'scroll_up') window.scrollBy({ top: -window.innerHeight * 0.8, behavior: 'smooth' });
                    else if (args.action === 'replay_step') window.dispatchEvent(new Event('voice-replay-step'));
                    else if (args.action === 'log_note') window.dispatchEvent(new CustomEvent('voice-log-note', { detail: { text: args.text } }));
                    else if (args.action === 'navigate_vehicles') navigate('/vehicles');
                    else if (args.action === 'navigate_settings') navigate('/settings');
                    else if (args.action === 'navigate_home') navigate('/');
                    else if (args.action === 'navigate_parts') navigate('/parts');
                    else if (args.action === 'navigate_diagnostics') navigate('/diagnostics');
                    else if (args.action === 'navigate_reports') navigate('/reports');
                    else if (args.action === 'navigate_inspections') navigate('/inspections');
                    responseData = { success: true };
                  } else if (call.name === 'searchKnowledgeBank') {
                    // search logic here later
                    responseData = { results: "Feature temporarily offline" };
                  } else if (call.name === 'postMessage') {
                    if (user) {
                      await addDoc(collection(db, 'messages'), {
        ownerId: auth.currentUser?.uid || '',
                        text: args.text,
                        senderId: user.uid,
                        senderName: profile?.displayName,
                        senderRole: profile?.role,
                        createdAt: serverTimestamp()
                      });
                      responseData = { success: true };
                    } else {
                      responseData = { error: "User not authenticated" };
                    }
                  }
                } catch (err: any) {
                  responseData = { error: err?.message || err || "Unknown error" };
                }
                functionResponses.push({
                   id: call.id,
                   name: call.name,
                   response: responseData
                });
              }
              
              if (functionResponses.length > 0) {
                 sessionPromise.then(session => {
                    session.sendToolResponse({ functionResponses });
                 });
              }
            }

            // Handle Transcriptions
            // TODO handle transcriptions for UI display
            // Let's clear the prompt text after some time or accumulate it?
          }
        }
      });
      sessionRef.current = await sessionPromise;
      
    } catch (err: any) {
      console.error("Failed to start live session:", err);
      setError(err?.message || "Failed to start live session. Please check microphone permissions.");
      setIsConnecting(false);
      setIsConnected(false);
    }
  }, [isConnected, isConnecting, selectedVoice, navigate, user]);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setIsConnecting(false);
    if (sessionRef.current) {
      // LiveConnectSession usually has close? Or maybe just let it be GC'd?
      // According to sdk, no strict close is mentioned, just ignore. Actually, the documentation says `session.close()`!
      (sessionRef.current as any).close?.();
      sessionRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (audioStreamerRef.current) {
      audioStreamerRef.current.close();
      audioStreamerRef.current = null;
    }
    setAgentResponse(null);
  }, []);

  return {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    agentResponse,
    clearAgentResponse: () => setAgentResponse(null),
    userTranscript,
    error,
    clearError: () => setError(null)
  };
}
