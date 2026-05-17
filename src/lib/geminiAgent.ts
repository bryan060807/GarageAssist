import { GoogleGenAI } from '@google/genai';

export function getAi() {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

export async function interpretDiagnostics(symptoms: string, obd2Codes: string) {
  try {
    const prompt = `You are a Master Mechanic AI assistant. I have a vehicle issue.
Symptoms: ${symptoms || 'None provided'}
OBD2 Codes: ${obd2Codes || 'None provided'}

Please provide:
1. Potential overarching cause.
2. Step-by-step diagnostic process to confirm the issue.
3. Common fixes or parts needed.
Make the output formatted in clean Markdown.`;

    const response = await getAi().models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error: any) {
    console.error("Diagnostic AI Error:", error);
    throw new Error(error.message || "Failed to analyze diagnostics.");
  }
}

export async function interpretPartImage(base64Image: string, mimeType: string, description: string) {
  try {
    const prompt = `You are a Master Mechanic AI assistant. I am showing you an image of a car part or area of a vehicle.
${description ? `Context/Description provided by mechanic: ${description}` : ''}

Please analyze the image and provide:
1. Identification of the part or area (if possible).
2. Visible wear, tear, leaks, or damage assessment.
3. Recommendations for replacement or repair based on visual condition.
Output in clean Markdown.`;

    const response = await getAi().models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: [
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType
          }
        }
      ]
    });
    return response.text;
  } catch (error: any) {
    console.error("Vision AI Error:", error);
    throw new Error(error.message || "Failed to analyze image.");
  }
}

export async function troubleshootHardware(vehicleStr: string, obd2Context: string) {
  try {
    const prompt = `You are a Master Mechanic AI assistant and automotive diagnostic hardware expert. The user is experiencing issues connecting their OBD2 scanner or diagnostic hardware to their vehicle.

Vehicle: ${vehicleStr}
Context provided: ${obd2Context || 'None'}

Please provide an Interactive Hardware Connection Debugger:
1. Provide a step-by-step troubleshooting checklist for when software cannot communicate with the vehicle's computer modules.
2. Include specific common issues for this vehicle make/model (e.g., blown cigarette lighter fuse providing power to the OBD2 port, bent pins, CAN bus termination resistor issues).
3. Suggest alternatives for retrieving codes if the main OBD2 port is completely dead (e.g., paperclip trick if applicable to older cars, checking underhood diagnostic blocks).
Output in clean Markdown.`;

    const response = await getAi().models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error: any) {
    console.error("Hardware Debugger AI Error:", error);
    throw new Error(error.message || "Failed to troubleshoot hardware.");
  }
}

export async function calculateRepairWorth(vehicleStr: string, diagnosticsText: string) {
  try {
    const prompt = `You are a Master Mechanic and Automotive Appraiser AI. The user is facing a major repair and needs to know if it's worth it mathematically.

Vehicle: ${vehicleStr}
Diagnosis/Faults:
${diagnosticsText || 'None recorded'}

Please provide a Component Worth & Health Calculator analysis:
1. Estimate the current market value of this vehicle (running condition vs. current broken condition).
2. Estimate the cost of the repair described in the diagnosis (parts + labor).
3. Cross-reference the structural vehicle faults with current market valuation data to mathematically calculate whether this repair is worth the investment, or if the vehicle should be sold/scrapped.
4. Give a definitive "Fix it" or "Ditch it" recommendation with financial reasoning.
Output in clean Markdown.`;

    const response = await getAi().models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error: any) {
    console.error("Calculator AI Error:", error);
    throw new Error(error.message || "Failed to calculate repair worth.");
  }
}

export async function generateMaintenanceSchedule(vehicleStr: string, mileage: number) {
  try {
    const prompt = `You are a Master Mechanic AI assistant and automotive maintenance predictor. The user is asking for a proactive maintenance schedule for their vehicle.

Vehicle: ${vehicleStr}
Current Mileage: ${mileage} miles

Please provide a Proactive Preventive Maintenance & TSB Predictor report:
1. Identify the factory-recommended maintenance items due at or near this specific mileage.
2. Provide an estimated cost range for these services (parts + labor).
3. Highlight known Technical Service Bulletins (TSBs) or common major failure points to watch out for on this specific make/model around this mileage.
4. Recommend any preventative upgrades that extend vehicle lifespan (e.g., catching a common water pump failure before it happens).
Output in clean Markdown.`;

    const response = await getAi().models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error: any) {
    console.error("Maintenance Predictor AI Error:", error);
    throw new Error(error.message || "Failed to generate maintenance schedule.");
  }
}

export async function fetchVehicleOptions(year: string | number, make: string, model: string) {
  try {
    const prompt = `You are an automotive database API.
Based on the vehicle details provided:
Year: ${year}
Make: ${make}
Model: ${model}

Respond ONLY with a valid minified JSON object containing two arrays: 'submodels' and 'engines' available for this specific vehicle. Do NOT include any markdown formatting, backticks, or other text.
Example format:
{"submodels":["LX","EX","Touring"],"engines":["1.5L Turbo 4-Cylinder","2.0L 4-Cylinder"]}

If you don't know the specifics or if the vehicle combination is invalid, return empty arrays.`;

    const response = await getAi().models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
    });
    
    const text = response.text || "{}";
    const cleanedText = text.replace(/^```(json)?|```$/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error: any) {
    console.error("Vehicle Options AI Error:", error);
    return { submodels: [], engines: [] };
  }
}

export async function extractToolsAndRentals(diagnosisContext: string) {
  try {
    const prompt = `Based on the following vehicle diagnosis and repair steps, please:
1. Generate a precise list of ALL required tools (e.g., "30mm deep axle socket, pitman arm puller, torque wrench").
2. Provide direct links or suggestions for checking real-time availability and pricing at local auto parts stores (e.g., O'Reilly, AutoZone) for any specialty tool rentals needed. Use markdown links like [O'Reilly Tool Rental](https://www.oreillyauto.com/store-services/rental-tools) and [AutoZone Loan-A-Tool](https://www.autozone.com/lp/loan-a-tool).
3. Recommend safe, community-verified "homemade" workaround methods (DIY Rig Alternatives) if a specialty tool is unavailable (e.g., building a bushing press using threaded rod, nuts, and heavy washers).

Diagnosis Context:
${diagnosisContext}

Output the response in clean Markdown.`;

    const response = await getAi().models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error: any) {
    console.error("Tools AI Error:", error);
    throw new Error(error.message || "Failed to extract tools and rental info.");
  }
}

export async function askAI(promptText: string, context?: string) {
  try {
    const prompt = `You are a Master Mechanic AI assistant for GarageAssist.
Context (if any): ${context || 'None'}

Hyper-Specific Part & Spec Matching Instructions:
When the user asks about a specific repair or part:
1. Fastener Torque Memory: Always attempt to provide the EXACT torque specifications for the specific vehicle make, model, and fastener mentioned.
2. Component-Specific Position Mapping: Provide verbal visual diagrams, orientation descriptions, or step-by-step reassembly positioning (e.g., "Push the lower control arm bushing in from the chamfered rear side").

User: ${promptText}`;

    const response = await getAi().models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error: any) {
    console.error("Ask AI Error:", error);
    throw new Error(error.message || "Failed to ask AI.");
  }
}

export async function decodeWiringHarness(base64Image: string, mimeType: string, vehicleStr: string, description: string) {
  try {
    const prompt = `You are a Master Mechanic AI assistant and an expert auto electrician. I am showing you an image of a wiring harness or wire bundle in a vehicle (${vehicleStr}).
${description ? `Context/Description provided by mechanic: ${description}` : ''}

Please analyze the image and provide a Wiring Harness Wire Decoder analysis:
1. Identify the visible wire colors (e.g., red/white stripe, solid black).
2. Predict their exact power, ground, or signal functions based on standard factory wiring diagrams for this vehicle.
3. Highlight any damaged, burnt, or spliced wires visible.
Output in clean Markdown.`;

    const response = await getAi().models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: [
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType
          }
        }
      ]
    });
    return response.text;
  } catch (error: any) {
    console.error("Wiring AI Error:", error);
    throw new Error(error.message || "Failed to decode wiring harness.");
  }
}

export async function localizeComponents(base64Image: string, mimeType: string, vehicleStr: string, componentToFind: string) {
  try {
    const prompt = `You are an expert mechanic AI giving spatial mapping assistance. I am showing you an image of an engine bay or suspension for a ${vehicleStr}.
${componentToFind ? `The mechanic is looking for: ${componentToFind}` : 'Identify all major visible components and any hidden ones that would be behind these panels/parts.'}

Please analyze the image and provide Component Localization:
1. Describe exactly where the requested parts (or major components) are located in the image.
2. If the part is hidden, explain what needs to be removed to access it (e.g., "The PCV valve is located under the intake manifold, behind the throttle body.").
Output in clean Markdown.`;

    const response = await getAi().models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: [
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType
          }
        }
      ]
    });
    return response.text;
  } catch (error: any) {
    console.error("Localize AI Error:", error);
    throw new Error(error.message || "Failed to localize components.");
  }
}

export async function verifyReassembly(base64Image: string, mimeType: string, vehicleStr: string, componentName: string) {
  try {
    const prompt = `You are an expert automotive quality assurance inspector. I am showing you an image of a reassembled component (${componentName}) for a ${vehicleStr}.

Please perform Before-and-After Verification:
1. Analyze the live camera view of this reassembled component.
2. Compare its visible state against what the factory/3D model ideal state should be.
3. Confirm if the clocking position, orientation, and placement are correct before the mechanic lowers the vehicle.
4. Highlight any misalignments, missing fasteners, or incorrect orientations (e.g., "The torsion bar key is off by one spline" or "The ball joint grease zerk should face inward").
Output in clean Markdown.`;

    const response = await getAi().models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: [
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType
          }
        }
      ]
    });
    return response.text;
  } catch (error: any) {
    console.error("Verify AI Error:", error);
    throw new Error(error.message || "Failed to verify reassembly.");
  }
}

export async function suggestPartPurchase(partName: string, vehicleStr: string) {
  try {
    const prompt = `You are a savvy auto parts shopper.
I need to buy a "${partName}" for a "${vehicleStr || 'general vehicle'}".
Which online auto parts retailer (e.g., RockAuto, Amazon, 1A Auto, PartsGeek, eBay Motors, or local stores like AutoZone/O'Reilly) typically has the cheapest reliable option for this specific type of part?
Please provide a brief 2-sentence recommendation on where to buy it and a rough estimated cost context.
Search the web for current pricing if possible.`;

    const response = await getAi().models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
      tools: [{ googleSearch: {} }]
    });
    return response.text;
  } catch (error: any) {
    console.error("Part Suggestion AI Error:", error);
    throw new Error(error.message || "Failed to get part suggestion.");
  }
}

export async function generateHealthReport(vehicleStr: string, diagnosticsText: string, inspectionsText: string) {
  try {
    const prompt = `You are an expert automotive inspector. Create a comprehensive Vehicle Health Report for a ${vehicleStr}.

Diagnostics Context (Recent OBD2 Scans / Symptoms):
${diagnosticsText || 'None recorded'}

Photo Inspections Context (Recent Visual Checks):
${inspectionsText || 'None recorded'}

Output a professional, easy-to-read health report in Markdown covering:
1. Overall Vehicle Status Summary
2. Critical Issues (if any)
3. Minor Issues (if any)
4. Maintenance Recommendations`;

    const response = await getAi().models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error: any) {
    console.error("Report AI Error:", error);
    throw new Error(error.message || "Failed to generate report.");
  }
}
