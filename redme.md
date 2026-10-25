**ResearchPilot — AI Research & Agentic RAG Platform**

*Technologies: Next.js, React, Node.js, Express, MongoDB, Gemini, Tavily, embeddings, RAG, LLM tool calling*

- Built an AI research application that combines web search, document-based retrieval, LLM-generated research reports, and source-backed claim verification.
- Implemented a PDF ingestion and retrieval pipeline for answering questions using document content.
- Developed a research verification workflow that classifies claims as supported, contradicted, or insufficiently evidenced.
- **Planned enhancement:** Add controlled LLM tool calling to orchestrate web search, document retrieval, and evidence verification, with bounded execution and failure handling.
- **Planned enhancement:** Improve passage-level citations, automated evaluation, conversation persistence, and production deployment.



What should you build next?
Since your goal is to learn RAG and Agentic AI through ResearchPilot, I recommend this order:

1. Build document-based RAG
Upload a PDF, extract its text, split it into chunks, create embeddings, and retrieve relevant chunks when a user asks a question.
Start here




2. Combine web search and RAG
Let ResearchPilot use both live web results and documents uploaded by the user.




3. Add controlled agentic behavior
Let the system choose tools, such as web search, document retrieval, or claim verification, based on the user's question.




4. Improve evaluation
Test whether answers are grounded in retrieved evidence, citations support claims, and the verifier correctly handles conflicting or insufficient evidence.


I recommend adding chat history and document selection to ResearchPilot.
1. Multiple PDFs: Upload and query different documents independently.
2. Better source citations: Show the exact passages used for each answer, not just chunk numbers.
3. Chat interface: Build a ChatGPT-style UI with Next.js and Tailwind CSS.
4. Conversation history: Store questions and answers in MongoDB.
5. Answer reliability: Tell the model to say when the retrieved context does not contain the answer.




We are currently at Phase 3: Improving ResearchPilot's answer quality and citation reliability.

Based on our previous tests, your backend is already running, MongoDB is connected, Tavily search is working, and Gemini is generating readable answers.

## ResearchPilot — Current progress

Phase 1: Backend setup and database

Express API and MongoDB Atlas connection

Working

Phase 2: AI research pipeline

Gemini responses and Tavily web search

Working

Phase 3: Citation reliability

Ensure citations link to retrieved sources and avoid unsupported claims.

In progress

Phase 4: Research quality and verification

Check factual claims against retrieved webpages.

Pending

Phase 5: Frontend integration and final testing

Connect the research experience to your Next.js UI and test end to end.

Pending

## Where we stopped

Your latest Insomnia response confirmed:

- The answer's Markdown formatting is readable.
- The duplicate Sources section is fixed; only one `### Sources` section remains.
- Tavily search and Gemini answer generation are working.

The next task: open `backend/researchUtils.js` and find this function:

```
function validateCitationUrls(answer, sources = {}) {
```

The actual default in your earlier code was `sources = []`, so look for the function name rather than copying the signature exactly.

Paste the complete `validateCitationUrls()` function here. We'll improve it without breaking the working parts of ResearchPilot.