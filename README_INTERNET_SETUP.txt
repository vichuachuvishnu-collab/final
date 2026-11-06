ROLL CALL LIVE — INTERNET VERSION

WHAT THIS DOES
• You open the admin webpage on your laptop from its public internet link.
• Enter today's order and Important Announcement, then press PUBLISH ORDER.
• Every phone, laptop and TV opening the same link (add ?display=1 for TV mode) receives the update automatically, about every 2 seconds.
• Data is stored in Supabase, so it remains available after the server restarts.
• Publishing is protected by an Admin PIN. Viewing is public to anyone with the link.

IMPORTANT: This ZIP is the application, not a hosted website. To make a public link, deploy it once using the steps below.

1) CREATE THE DATABASE
A. Create a project at https://supabase.com/.
B. Open SQL Editor and run the contents of SUPABASE_SETUP.sql.
C. In Project Settings > API, copy the Project URL and the service_role key. Keep the service_role key SECRET.

2) DEPLOY THE WEBSITE
A. Create a GitHub repository and upload these files: server.js, index.html, package.json.
B. Create a Web Service on https://render.com/ and connect that repository.
C. Runtime: Node. Build command: npm install. Start command: npm start.
D. Add these Environment Variables in Render:
   SUPABASE_URL = your Supabase Project URL
   SUPABASE_SERVICE_ROLE_KEY = your Supabase service_role key
   ADMIN_PIN = choose a private PIN (do not share it)
E. Deploy. Render gives you a public address such as https://your-app.onrender.com.

3) USE IT
• Admin/editor: https://your-app.onrender.com/
• TV/display: https://your-app.onrender.com/?display=1
• Enter your Admin PIN in the box next to PUBLISH ORDER, type the order, and publish.
• Open the display link on all connected TVs/devices. They need internet access, not the same Wi-Fi.
• Keep the Render service deployed. The first request after an idle period on a free service may take a little longer.

SECURITY
• Never put the Supabase service_role key in index.html or share it.
• Anyone with the display link can view the published order. Only someone with the Admin PIN can publish.
• Choose a strong PIN and change it in Render environment variables if it is exposed.

LOCAL TEST
Install Node.js 18+, set the four environment variables in your terminal, then run: npm start
