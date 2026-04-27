

\- Go to Plesk panel - https://213.210.36.24:8443/

\- Click on Tools \& Settings -> SSH Terminal



**#### Clone the repo**



\- cd /var/www/html

\- git clone git@github.com:digiexdirectors-art/lense-eye-foundtion.git

\- cd lense-eye-foundation/



**#### Setup Backend**



\- cd backend/

\- npm i

\- pm2 start "npm start" --name "backend-lense-eye-foundation"

\- pm2 log backend-lense-eye-foundation



**#### Setup Frontend**



\- cd ../frontend

\- npm i

\- npm run build

\- cd dist/

\- pm2 start angular-http-server --name "frontend-lense-eye-foundation" -- -p 3000



**#### After both Frontend and Backend setup is done, save the processes**



\- pm2 save



\*\*The app is not running at - <SERVER\_IP>:3000\*\*



