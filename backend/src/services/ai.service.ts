import axios from 'axios';

export interface AIAnalysisResult {
  category: string;
  subcategory: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  possibleCauses: string[];
  recommendedActions: string[];
  suggestedTeam: string;
}

// Rules-based deterministic fallback engine
const runRuleEngine = (title: string, description: string): AIAnalysisResult => {
  const text = `${title} ${description}`.toLowerCase();
  
  if (text.includes('wifi') || text.includes('internet') || text.includes('network') || text.includes('switch') || text.includes('router') || text.includes('ping')) {
    return {
      category: 'Network',
      subcategory: text.includes('wifi') ? 'WiFi' : 'Connectivity',
      priority: text.includes('switch') || text.includes('router') ? 'High' : 'Medium',
      possibleCauses: ['Access Point port failure', 'DHCP pool exhaustion', 'Cable disconnection'],
      recommendedActions: ['Ping the gateway IP', 'Verify PoE switch link lights', 'Check DHCP server lease counts'],
      suggestedTeam: 'Network Team',
    };
  }

  if (text.includes('camera') || text.includes('cctv') || text.includes('nvr') || text.includes('stream')) {
    return {
      category: 'CCTV',
      subcategory: text.includes('nvr') ? 'NVR' : 'Camera',
      priority: text.includes('nvr') ? 'High' : 'Medium',
      possibleCauses: ['IP camera power supply issue', 'PoE switch port down', 'NVR channel configuration change'],
      recommendedActions: ['Check PoE switch status', 'Verify camera IP ping response', 'Check RTSP stream URL credentials'],
      suggestedTeam: 'Security Systems Team',
    };
  }

  if (text.includes('slow') || text.includes('lag') || text.includes('teams') || text.includes('computer') || text.includes('laptop')) {
    return {
      category: 'Hardware',
      subcategory: 'Performance',
      priority: 'Medium',
      possibleCauses: ['High memory utilization by Microsoft Teams', 'Thermal throttling on CPU', 'Disk read/write latency'],
      recommendedActions: ['Clear MS Teams application cache', 'Check hardware resource manager charts', 'Run diagnostic CPU stress test'],
      suggestedTeam: 'Desktop Support',
    };
  }

  if (text.includes('erp') || text.includes('database') || text.includes('server') || text.includes('unreachable') || text.includes('critical')) {
    return {
      category: 'Server',
      subcategory: 'Infrastructure',
      priority: 'Critical',
      possibleCauses: ['Mongoose Database cluster downtime', 'Docker daemon service crash', 'Out of memory kernel killer execution'],
      recommendedActions: ['Check server CPU/RAM telemetry logs', 'Attempt mongo daemon service restart', 'Examine container health flags'],
      suggestedTeam: 'Infrastructure Team',
    };
  }

  return {
    category: 'Application',
    subcategory: 'General',
    priority: 'Medium',
    possibleCauses: ['Generic software exception', 'User credential mismatch'],
    recommendedActions: ['Examine application log tracer', 'Request user trace log screenshot'],
    suggestedTeam: 'Service Desk Team',
  };
};

export class AIService {
  private static geminiKey = process.env.GEMINI_API_KEY || '';

  // 1. Analyze Ticket and return Category, Priority, Causes, Actions, Team
  public static async analyzeTicket(title: string, description: string): Promise<AIAnalysisResult> {
    if (!this.geminiKey) {
      console.warn('[AI Service] Gemini API key not found. Falling back to Rule Engine.');
      return runRuleEngine(title, description);
    }

    try {
      const prompt = `
        Analyze this IT incident report. Return a structured JSON object matching this schema:
        {
          "category": "string (e.g. Network, CCTV, Hardware, Software, Server, Application, Security)",
          "subcategory": "string (e.g. WiFi, Camera, Performance, Access, email, Database)",
          "priority": "string (one of: Low, Medium, High, Critical)",
          "possibleCauses": ["string", "string"],
          "recommendedActions": ["string", "string"],
          "suggestedTeam": "string (e.g. Network Team, Security Systems Team, Desktop Support, Infrastructure Team, Service Desk Team)"
        }
        
        Incident Title: "${title}"
        Incident Description: "${description}"
        
        Ensure output is strictly raw JSON only.
      `;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        },
        { timeout: 8000 }
      );

      const responseText = response.data.candidates[0].content.parts[0].text;
      const parsed: AIAnalysisResult = JSON.parse(responseText.trim());
      
      // Ensure priority matches enum
      const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
      if (!validPriorities.includes(parsed.priority)) {
        parsed.priority = 'Medium';
      }

      return parsed;
    } catch (err: any) {
      console.error(`[AI Service] Gemini invocation failed: ${err.message}. Falling back to Rule Engine.`);
      return runRuleEngine(title, description);
    }
  }

  // 2. Generate troubleshooting steps in ticket chat
  public static async generateTroubleshooting(title: string, description: string, assetContext?: string): Promise<string> {
    if (!this.geminiKey) {
      console.warn('[AI Service] Gemini API key not found. Returning local diagnostic guide.');
      const rule = runRuleEngine(title, description);
      return `AI Diagnostic Fallback:\nBased on symptoms, let's troubleshoot step-by-step:\n` + 
        rule.recommendedActions.map((act, i) => `${i + 1}. ${act}`).join('\n') + 
        `\n\nPossible Causes evaluated:\n` + 
        rule.possibleCauses.map((cause) => `- ${cause}`).join('\n');
    }

    try {
      const prompt = `
        You are an agentic troubleshooting engineer. Provide a step-by-step troubleshooting guide for an IT Engineer resolving this ticket. Keep it highly operational.
        
        Ticket: ${title} - ${description}
        ${assetContext ? `Asset Context Details: ${assetContext}` : ''}
        
        Output format: Bullet points, detailed instructions, concise, and structured.
      `;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
        },
        { timeout: 10000 }
      );

      return response.data.candidates[0].content.parts[0].text.trim();
    } catch (err: any) {
      console.error(`[AI Service] Troubleshooting fetch failed: ${err.message}`);
      return `Failed to fetch dynamic troubleshooting from AI. Please reference local SOP manuals.`;
    }
  }

  // 3. Validate resolution notes
  public static async validateResolution(
    ticketDescription: string,
    resolutionNotes: string
  ): Promise<{ resolved: boolean; confidence: number; notes: string }> {
    if (!this.geminiKey) {
      console.warn('[AI Service] Gemini key missing. Performing basic keyword resolution validation.');
      const isResolved = resolutionNotes.trim().length > 10;
      return {
        resolved: isResolved,
        confidence: isResolved ? 80 : 0,
        notes: isResolved
          ? 'Resolution notes accepted based on minimal validation length.'
          : 'Resolution notes are too short or descriptive checks failed.',
      };
    }

    try {
      const prompt = `
        Analyze if this resolution description is reasonable and addresses the reported IT incident symptoms.
        Return raw JSON only:
        {
          "resolved": boolean,
          "confidence": number (0-100),
          "notes": "string explanation"
        }
        
        Incident Description: "${ticketDescription}"
        Resolution Notes: "${resolutionNotes}"
      `;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        },
        { timeout: 8000 }
      );

      const responseText = response.data.candidates[0].content.parts[0].text;
      return JSON.parse(responseText.trim());
    } catch (err: any) {
      console.error(`[AI Service] Validation failed: ${err.message}`);
      return {
        resolved: true,
        confidence: 50,
        notes: 'Fallback validation accepted automatically.',
      };
    }
  }
}
