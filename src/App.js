import { useState } from "react";
import { ethers } from "ethers";

function App() {
  const [account, setAccount] = useState("null");
  const [contract, setContract] = useState(null);
  const [records, setRecords] = useState([]);
  const [cid, setCid] = useState("");


 const connectWallet = async () => {
  if (!window.ethereum) {
    alert("Install MetaMask!");
    return;
  }

  try {
    await window.ethereum.request({
  method: "wallet_switchEthereumChain",
  params: [{ chainId: "0xaa36a7" }], // Sepolia chain ID
});
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // 👇 ADD THIS PART
    const contractAddress = "0x79D213bE1810FcBC5F3a118B0461680FA15cB1Bf"

;

    const abi =  [
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_ipfsHash",
				"type": "string"
			}
		],
		"name": "storeHash",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getMyRecords",
		"outputs": [
			{
				"components": [
					{
						"internalType": "string",
						"name": "ipfsHash",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "timestamp",
						"type": "uint256"
					}
				],
				"internalType": "struct IPVault.Record[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "records",
		"outputs": [
			{
				"internalType": "string",
				"name": "ipfsHash",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
] ;

    const contractInstance = new ethers.Contract(
      contractAddress,
      abi,
      signer
    );

    setContract(contractInstance);

    console.log("Contract:", contractInstance);

    setAccount(accounts[0]);
  } catch (error) {
    console.error(error);
  }
};

const fetchRecords = async () => {
  if (!contract) {
    alert("Connect wallet first");
    return;
  }

  try {
    const data = await contract.getMyRecords();
    setRecords(data);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
};


const storeData = async () => {
  if (!contract) {
    alert("Connect wallet first");
    return;
  }

  if (!cid) {
    alert("Please enter a CID first!");
    return;
  }


  try {
    const tx = await contract.storeHash(cid);

    await tx.wait();
    console.log("Stored!");
    await fetchRecords(); // 👈 REFRESH THE LIST
  } catch (error) {
    console.error(error);
  }
};

  return (
    <div style={{ padding: "20px" }}>
      <h1>IP Vault 🚀</h1>
    <button onClick={fetchRecords}>
      Get My Records
    </button>
      <button onClick={connectWallet}>
        Connect Wallet
      </button>

      <div style={{ marginTop: "20px" }}>
        <input
          type="text"
          placeholder="Enter IPFS CID"
          value={cid}
          onChange={(e) => setCid(e.target.value)}
          style={{ padding: "8px", width: "300px", marginRight: "10px" }}
        />
        <button onClick={storeData}>
          Store CID
        </button>
      </div>

      <p>Account: {account}</p>

      <ul>
        {records.map((record, index) => (
          <li key={index} style={{ marginBottom: "10px" }}>
            CID: <a href={`https://ipfs.io/ipfs/${record.ipfsHash}`} target="_blank" rel="noopener noreferrer">
            {record.ipfsHash}
            </a> <br />
            Time: {new Date(Number(record.timestamp) * 1000).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}


export default App;