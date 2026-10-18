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