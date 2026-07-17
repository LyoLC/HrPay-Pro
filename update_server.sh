#!/bin/bash
awk '
/import express from/ {
    print "import { GoogleGenAI } from \"@google/genai\";"
    print $0
    next
}
/app.get\("\/api\/health"/ {
    print "  app.post(\"/api/ai/chat\", async (req, res) => {"
    print "    try {"
    print "      const apiKey = process.env.GEMINI_API_KEY;"
    print "      if (!apiKey) return res.status(500).json({ error: \"GEMINI_API_KEY is missing\" });"
    print "      const ai = new GoogleGenAI({ apiKey });"
    print "      const { messages, context } = req.body;"
    print "      let systemInstruction = \"You are HRPay Pro AI, an intelligent Human Resources Assistant. You speak Portuguese. You help HR managers, administrators, and employees with tasks like drafting contracts, summarizing data, and answering HR policy questions. Format responses cleanly in Markdown.\";"
    print "      if (context) {"
    print "        systemInstruction += \"\\n\\nHere is some context about the current state/data:\\n\" + JSON.stringify(context);"
    print "      }"
    print "      const response = await ai.models.generateContent({"
    print "        model: \"gemini-2.5-flash\","
    print "        contents: messages,"
    print "        config: { systemInstruction }"
    print "      });"
    print "      res.json({ text: response.text });"
    print "    } catch (error: any) {"
    print "      console.error(\"AI Chat Error:\", error);"
    print "      res.status(500).json({ error: error.message || \"AI processing failed\" });"
    print "    }"
    print "  });"
    print ""
    print $0
    next
}
{ print }
' server.ts > server.ts.new && mv server.ts.new server.ts
