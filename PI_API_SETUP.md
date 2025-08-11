# Pi Network API Setup Instructions

## 🔑 Getting Your Pi Network API Key

To enable Pi payments in your app, you need to:

1. **Register Your App with Pi Network:**
   - Go to: https://develop.pi/
   - Log in with your Pi account
   - Create a new app or select existing app
   - Navigate to "API Keys" section

2. **Get Your API Key:**
   - Copy your API key from the developer portal
   - It will be a long string of letters and numbers
   - Sandbox keys start with different prefixes than production keys

3. **Update Your .env File:**
   - Open `c:\Users\CenPe\Appraisells\.env`
   - Replace `your_pi_api_key_here` with your actual API key
   - Example: `PI_API_KEY=your_actual_key_from_pi_developer_portal`

4. **Configure Your App Settings:**
   - In Pi Developer Portal, set your app URL to: `https://cdb99f14b14d.ngrok-free.app`
   - Add payment callbacks if required
   - Set sandbox mode for testing

## 🏖️ Sandbox Mode (Default)

- Currently set to `PI_SANDBOX=true` in .env
- Allows testing without real Pi coins
- Payments will work even without API key (for testing)
- Switch to `PI_SANDBOX=false` for production

## 🔧 After Adding API Key

1. Save the .env file
2. Restart the server: `node server.js`
3. Test payment - should work without timeout

## 📋 Current Configuration Status

- ✅ .env file created
- ✅ dotenv package installed  
- ✅ Pi API integration added
- ✅ Sandbox mode enabled
- ⏳ **Need to add your Pi API key**

## 🚨 Important Notes

- **Never commit your API key to git** - .env should be in .gitignore
- Use sandbox keys for testing
- Use live keys only for production
- Keep your API key secure
