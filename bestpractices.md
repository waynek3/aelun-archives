If Possible and not in conflict with other docs, follow all best practices below:

1. Define Your Vision Clearly
Start with a strong, detailed vision of what you want to build and how it should work. If your input is vague or messy, the output will be too. Remember: garbage in, garbage out. Take time to think through your idea from both a product and user perspective. Use tools like Gemini 2.5 Pro in Google AI Studio to help structure your thoughts, outline the product goals, and map out how to bring your vision to life. The clearer your plan, the smoother the execution.

2. Plan Your UI/UX First

Before you start building, take time to carefully plan your UI. Use tools like v0 to help you visualize and experiment with layouts early. Consistency is key. Decide on your design system upfront and stick with it. Create reusable components such as buttons, loading indicators, and other common UI elements right from the start. This will save you tons of time and effort later on You can also use **https://21st.dev/**; it has a ton of components with their AI prompts, you just copy-paste the prompt, it is great!

3. Master Git & GitHub
Git is your best friend. You must know GitHub and Git; it will save you a lot if AI messed things up, you could easily return to an older version. If you did not use Git, your codebase could be destroyed with some wrong changes. You must use it; it makes everything much easier and organized. After finishing a big feature, you must make sure to commit your code. Trust me, this will save you from a lot of disasters in the future!

4. Choose a Popular Tech Stack
Stick to widely-used, well-documented technologies. AI models are trained on public data. The more common the stack, the better the AI can help you write high-quality code.

I personally recommend:

Next.js (for frontend and APIs) + Supabase (for database and authentication) + Tailwind CSS (for styling) + Vercel (for hosting).

This combo is beginner-friendly, fast to develop with, and removes a lot of boilerplate and manual setup.

5. Utilize Cursor Rules
Cursor Rules is your friend. I am still using it and I think it is still the best solution to start solid. You must have very good Cursor Rules with all the tech stack you are using, instructions to the AI model, best practices, patterns, and some things to avoid. You can find a lot of templates here: **https://cursor.directory/**!!

6. Maintain an Instructions Folder
Always have an instructions folder. It should have markdown files. It should be full of docs-example components to provide to the Ai to guide it better or use (or context7 mcp, it has a tons of documentation).

7. Craft Detailed Prompts
Now the building phase starts. You open Cursor and start giving it your prompts. Again, garbage in, garbage out. You must give very good prompts. If you cannot, just go plan with Gemini 2.5 Pro on Google AI Studio; make it make a very good intricate version of your prompt. It should be as detailed as possible; do not leave any room for the AI to guess, you must tell it everything.

8. Break Down Complex Features
Do not give huge prompts like "build me this whole feature." The AI will start to hallucinate and produce shit. You must break down any feature you want to add into phases, especially when you are building a complex feature. Instead of one huge prompt, it should be broken down into 3-5 requests or even more based on your use case.

9. Manage Chat Context Wisely
When the chat gets very big, just open a new one. Trust me, this is the best. The AI context window is limited; if the chat is very big, it will forget everything earlier, it will forget any patterns, design and will start to produce bad outputs. Just start a new chat window then. When you open the new window, just give the AI a brief description about the feature you were working on and mention the files you were working on. Context is very important (more on that is coming..)!

10. Don't Hesitate to Restart/Refine Prompts
When the AI gets it wrong and goes in the wrong way or adding things that you do not want, returning back, changing the prompt, and sending the AI again would be just much better than completing on this shit code because AI will try to save its mistakes and will probably introduce new ones. So just return, refine the prompt, and send it again!

11. Provide Precise Context
Providing the right context is the most important thing, especially when your codebase gets bigger. Mentioning the right files that you know the changes will be made to will save a lot of requests and too much time for you and the AI. But you must make sure these files are relevant because too much context can overwhelm the AI too. You must always make sure to mention the right components that will provide the AI with the context it needs.

12. Leverage Existing Components for Consistency
A good trick is that you can mention previously made components to the AI when building new ones. The AI will pick up your patterns fast and will use the same in the new component without so much effort!

13. Iteratively Review Code with AI
After building each feature, you can take the code of the whole feature, copy-paste it to Gemini 2.5 Pro (in Google AI Studio) to check for any security vulnerabilities or bad coding patterns; it has a huge context window. Hence, it actually gives very good insights where you can then input into to Claude in Cursor and tell it to fix these flaws. (Tell Gemini to act as a security expert and spot any flaws. In another chat, tell it so you are an expert (in the tech stack at your tech stack), ask it for any performance issues or bad coding patterns). Yeah, it is very good at spotting them! After getting the insights from Gemini, just copy-paste it into Claude to fix any of them, then send it Gemini again until it tells you everything is 100% ok.

14. Prioritize Security Best Practices
Regarding security, because it causes a lot of backlash, here are security patterns that you must follow to ensure your website is good and has no very bad security flaws (though it won't be 100% because there will be always flaws in any website by anyone!):

Trusting Client Data: Using form/URL input directly.

Fix: Always validate & sanitize on server; escape output.

Secrets in Frontend: API keys/creds in React/Next.js client code.

Fix: Keep secrets server-side only (env vars, ensure .env is in .gitignore).

Weak Authorization: Only checking if logged in, not if allowed to do/see something.

Fix: Server must verify permissions for every action & resource.

Leaky Errors: Showing detailed stack traces/DB errors to users.

Fix: Generic error messages for users; detailed logs for devs.

No Ownership Checks (IDOR): Letting user X access/edit user Y's data via predictable IDs.

Fix: Server must confirm current user owns/can access the specific resource ID.

Ignoring DB-Level Security: Bypassing database features like RLS for fine-grained access.

Fix: Define data access rules directly in your database (e.g., RLS).

Unprotected APIs & Sensitive Data: Missing rate limits; sensitive data unencrypted.

Fix: Rate limit APIs (middleware); encrypt sensitive data at rest; always use HTTPS.

15. Handle Errors Effectively
When you face an error, you have two options:

Either return back and make the AI do what you asked for again, and yeah this actually works sometimes.

If you want to continue, just copy-paste the error from the console and tell the AI to solve it. But if it took more than three requests without solving it, the best thing to do is returning back again, tweaking your prompt, and providing the correct context as I said before. Correct prompt and right context can save sooo much effort and requests.

16. Debug Stubborn Errors Systematically
If there is an error that the AI took so much on and seems never to get it or solve it and started to go on rabbit holes (usually after 3 requests and still did not get it right), just tell Claude to take an overview of the components the error is coming from and list top suspects it thinks are causing the error. And also tell it to add logs and then provide the output of them to it again. This will significantly help it find the problem and it works correctly most of the times!

17. Be Explicit: Prevent Unwanted AI Changes
Claude has this trait of adding, removing, or modifying things you did not ask for. We all hate it and it sucks. Just a simple sentence under every prompt like (Do not fuckin change anything I did not ask for Just do only what I fuckin told you) works very well and it is really effective!

18. Keep a "Common AI Mistakes" File
Always have a file of mistakes that you find Claude doing a lot. Add them all to that file and when adding any new feature, just mention that file. This will prevent it from doing any frustrating repeated mistakes and you from repeating yourself!

I know it does not sound as "vibe coding" anymore and does not sound as easy as all of others describe, but this is actually what you need to do in order to pull off a good project that is useful and usable for a large number of users. These are the most important tips that I learned after using Cursor for more than 6 months and building some projects using it! I hope you found it helpful and if you have any other questions I am happy to help!

Also, if you made it to here you are a legend and serious about this, so congrats bro!

Happy vibing!