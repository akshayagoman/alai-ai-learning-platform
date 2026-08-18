AllLearn.ai — Project Setup Guide
🚀 Getting Started
Follow these steps to install and run the project locally on your machine.

📁 1. Clone the Repository
Create a new folder on your local machine.

In this repository, click on the green "Code" button and copy the HTTPS link.

Open VS Code, go to the new folder you created.

Press Ctrl + Shift + P (or Cmd + Shift + P on Mac), search for "Git: Clone", and select "Clone from Git Repository".

Paste the copied link and press Enter.

Wait for 1–2 minutes for the project to be cloned into your folder.

⚙️ 2. Setup Environment Variables
Inside the cloned folder, create a new file named .env.local.

Add the following environment variables:

NEXT_PUBLIC_SUPABASE_URL=

NEXT_PUBLIC_SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=

🔑 3. Get Supabase Credentials
Go to Supabase and open your alai_beta project.

Navigate to:

Project Settings > Configuration > DATA API
→ Copy the Supabase URL and paste it into NEXT_PUBLIC_SUPABASE_URL.

Project Settings > API KEYS
→ Copy the anon public key and paste it into NEXT_PUBLIC_SUPABASE_ANON_KEY.
→ Copy the service_role secret and paste it into SUPABASE_SERVICE_ROLE_KEY.

⚠️ 4. Vulnerabilities Notice
You might encounter a 1 critical severity vulnerability warning during installation.
This can be safely ignored for now — it will not affect the local development.

💻 5. Run the Project
Use the following command in your terminal:

npm run dev
If the application is not fully rendered, simply refresh the browser.

✅ You're all set! Happy building with AllLearn.ai 🚀

this is a test commit from vscode and github desktop - navneeth

