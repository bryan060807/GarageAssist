import { useEffect, useState, useRef, useCallback } from 'react';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface Command {
  match: RegExp | string;
  action: (args?: RegExpMatchArray | null) => void;
}

export function useVoiceCommands(commands: Command[], onTranscript?: (t: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTranscript, setLastTranscript] = useState<string>('');
  
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const commandsRef = useRef<Command[]>(commands);
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => {
    commandsRef.current = commands;
    onTranscriptRef.current = onTranscript;
  }, [commands, onTranscript]);

  const showError = (msg: string) => {
    setError(msg);
    if (!msg.includes('context')) {
      setTimeout(() => setError(null), 5000);
    }
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      isListeningRef.current = true;
    };
    
    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript.toLowerCase().trim();
      setLastTranscript(transcript);

      // Match commands
      let matched = false;
      for (const cmd of commandsRef.current) {
        if (typeof cmd.match === 'string') {
          if (transcript.includes(cmd.match.toLowerCase())) {
            cmd.action();
            matched = true;
            break;
          }
        } else if (cmd.match instanceof RegExp) {
          const matchResult = transcript.match(cmd.match);
          if (matchResult) {
            cmd.action(matchResult);
            matched = true;
            break;
          }
        }
      }
      
      if (!matched && onTranscriptRef.current) {
        onTranscriptRef.current(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      if (event.error === 'not-allowed') {
        setIsListening(false);
        isListeningRef.current = false;
        showError('Microphone access denied. Please enable it in your browser settings.');
      } else if (event.error === 'aborted') {
        setIsListening(false);
        isListeningRef.current = false;
      } else if (event.error !== 'no-speech') {
        setIsListening(false);
        isListeningRef.current = false;
        showError(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      // If we want it to be continuous unless stopped manually:
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch(e) {
          setIsListening(false);
          isListeningRef.current = false;
        }
      } else {
        setIsListening(false);
        isListeningRef.current = false;
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        // Prevent onend from trying to restart by forcing ref to false
        isListeningRef.current = false;
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = useCallback(() => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      showError('Speech recognition not supported in this context. Try opening the app in a new tab, or use Chrome/Safari.');
      return;
    }
    
    if (!recognitionRef.current) return;
    
    if (isListening) {
      setIsListening(false);
      isListeningRef.current = false;
      recognitionRef.current.stop();
    } else {
      setError(null);
      try {
        isListeningRef.current = true;
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
        isListeningRef.current = false;
        setIsListening(false);
      }
    }
  }, [isListening]);

  return {
    isListening,
    toggleListening,
    error,
    lastTranscript,
  };
}
