# Dust Aggregator  

## 📌 Overview  

**Dust Aggregator** is a blockchain-based solution designed to help users consolidate and convert small, unused token balances (**dust**) into a more valuable and usable asset. Many crypto users accumulate dust from leftover trades, network fees, or failed transactions, leaving them with unusable token fragments.  

This platform enables users to:  

- ✅ **Connect multiple wallets** (Starknet, Ethereum, Solana, Polygon, Stellar).  
- ✅ **Detect and select dust tokens** in their wallets.  
- ✅ **Batch transfer dust** to a smart contract on Stellar.  
- ✅ **Convert dust** into a selected asset (e.g., USDC, XLM).  
- ✅ **Withdraw funds** or **donate dust** to charities.  

---

## 🚀 How It Works  

this is a one page application (SPA) to make it best for user experience

### **Step 1: Connect Wallets** 
Users begin by connecting their blockchain wallets. **Supported wallets include:**  
- **Ethereum & Polygon:** MetaMask, Coinbase Wallet  
- **Starknet:** Argent, Braavos  
- **Solana:** Phantom, Solflare  
- **Stellar:** Freighter  

When a wallet is connected, the platform reads the **token balances** and detects small amounts classified as **dust**.  

### **Step 2: Detect & Select Dust Tokens**  
- The app scans connected wallets for token balances that fall below a **user-defined threshold** (e.g., balances worth less than $5).  
- The detected dust is **displayed in the UI**, allowing users to choose which tokens to aggregate.  
- Users **select the dust tokens** they want to convert.  

### **Step 3: Batch Transfer to Smart Contract**  
- Once the user confirms the selection, the **dust tokens are sent to a Stellar smart contract.**  
- The smart contract **receives multiple transactions** and **processes them in batches** to **optimize gas fees**.  

### **Step 4: Swap & Conversion**  
- The smart contract aggregates all the dust and executes a **conversion mechanism**, swapping tokens into a selected asset.  
- Users can **choose their preferred asset** for conversion, such as:  
  - **Stablecoins (USDC, USDT, XLM)**  
  - **Native blockchain tokens (ETH, SOL, MATIC)**  
  - **Other supported tokens**  

### **Step 5: Withdraw or Donate**  
- After conversion, users can either:  
  - **Withdraw the converted balance** to their wallet.  
  - **Donate the funds** to a **charitable cause or ecosystem project** (optional).  

---

## 🔧 **Tech Stack & Architecture**  

| **Component** | **Technology** |
|--------------|---------------|
| **Frontend** | Next.js (React) + TypeScript |
| **Backend API** | Rust (Actix) or Node.js |
| **Blockchain Networks** | Starknet, Ethereum, Solana, Polygon, Stellar |
| **Smart Contracts**  Stellar Smart Contracts |
| **Wallet Integrations** | MetaMask, Phantom, Braavos, Freighter |
| **API & RPC Providers** | Alchemy, Infura, QuickNode |
| **Database (if needed)** | Supabase, PostgreSQL (for tracking transactions) |
smart contract deployed on stellar , functions are called using stellar SDK .
---

## 🏆 **Key Features**  

- **✅ Multi-Chain Support** – Works across Starknet, Solana, Ethereum, Polygon, and Stellar.  
- **✅ Smart Contract Automation** – Secure processing for dust aggregation and conversion.  
- **✅ Batch Transactions** – Reduces gas fees by consolidating transactions.  
- **✅ User-Friendly Interface** – Simple UI for selecting, converting, and withdrawing dust.  
- **✅ Donation Feature** – Convert small funds into meaningful impact.( todo! )

---

## 💡 **Why Dust Aggregation Matters**  

💰 **Unlock Small Balances** – Many wallets contain small token amounts that can't be used due to transaction fees.  
⏳ **Reduce Clutter** – Helps users manage and clean up their fragmented token balances.  
⚡ **Improve Liquidity** – Converts small holdings into a single, more valuable asset.  
🌱 **Support Ecosystem Growth** – Users can donate dust to blockchain projects or charities.  

---

stellar deployed smart contract link :https://stellar.expert/explorer/testnet/account/GA4RA7IGJ4HGTZPCDYVU4WWWCMWEK5THGDPWAONHKIWVNCHTNP3N6QW7


## 📖 **Setup & Installation**  

### **1. Clone the Repository**  
```sh
git clone https://github.com/JojoFlex1/Dust-aggregator.git
cd Dust-aggregator
```

### **2. Install Dependencies**  
```sh
npm install
# or
yarn install
```

### **3. Run the Development Server**  
```sh
npm run dev
# or
yarn dev
```
Then open `http://localhost:3000` in your browser.

### **4. Configure Wallets & API Keys**  
- Add your **Alchemy or Infura API keys** in `.env.local`.  
- Ensure your **wallet extensions** (MetaMask, Phantom, Freighter) are installed.  

---

## 📌 **Future Enhancements**  

- 🔹 **Database storage** – store data and transactions in database.  
- 🔹 **Automated Dust Collection** – Allow scheduled auto-sweeping of dust balances.  
  Donation Feature** – Convert small funds into meaningful impact.

---

## 🤝 **Contributing**  

Want to contribute? Open a **pull request** or **submit an issue**!  

```sh
git checkout -b feature-new-update
git commit -m "Added new feature"
git push origin feature-new-update
```

---


## 📜 **License**  

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.  
 

🚀 **Big Wins Ahead!**  

