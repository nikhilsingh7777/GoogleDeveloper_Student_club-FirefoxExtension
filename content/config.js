export default {
  api: {
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    headers: { 'Content-Type': 'application/json' },
    maxTokens: 200
  },
  prompts: {
    summarize: 'Summarize the following text: ',
    css: 'Generate CSS based on this description: '
  }
};