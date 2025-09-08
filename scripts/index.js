const { ethers } = require("ethers");
const fs = require("fs");
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { encryptData, decryptData } = require("./cryptoUtils");

const provider = new ethers.JsonRpcProvider(
  `https://sepolia.infura.io/v3/${process.env.APIKEY}`
);

const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract_address = process.env.SAFEBOX;

const abi = [
  {"type":"constructor","stateMutability":"nonpayable","inputs":[{"internalType":"address","name":"_impl","type":"address"},{"internalType":"address","name":"_owner","type":"address"}]},
  {"type":"function","name":"deposit","stateMutability":"payable","inputs":[],"outputs":[]},
  {"type":"function","name":"getETH","stateMutability":"nonpayable","inputs":[],"outputs":[]},
  {"type":"function","name":"sendETH","stateMutability":"nonpayable","inputs":[{"internalType":"address payable","name":"_to","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"outputs":[]},
  {"type":"function","name":"upgrade","stateMutability":"nonpayable","inputs":[{"internalType":"address","name":"_newImplementation","type":"address"}],"outputs":[]},
  {"type":"function","name":"getBalance","stateMutability":"view","inputs":[],"outputs":[{"internalType":"uint256","name":"","type":"uint256"}]},
  {"type":"function","name":"deletePassword","stateMutability":"nonpayable","inputs":[{"internalType":"uint256","name":"_key","type":"uint256"}],"outputs":[]},
  {"type":"function","name":"getPassword","stateMutability":"view","inputs":[{"internalType":"uint256","name":"_key","type":"uint256"}],"outputs":[{"internalType":"bytes","name":"","type":"bytes"}]},
  {"type":"function","name":"setPassword","stateMutability":"nonpayable","inputs":[{"internalType":"uint256","name":"_key","type":"uint256"},{"internalType":"bytes","name":"_data","type":"bytes"}],"outputs":[]},
  {"type":"receive","stateMutability":"payable"},
  {"type":"fallback","stateMutability":"payable"}
];

const contract = new ethers.Contract(contract_address, abi, wallet);
const datapath = './data.json';
let counter = 1;

if (fs.existsSync(datapath)) {
  const raw = fs.readFileSync(datapath, 'utf8');
  const _data = JSON.parse(raw);
  const keys = Object.keys(_data).map(k => parseInt(k));
  if (keys.length > 0) counter = Math.max(...keys) + 1;
}

async function setPassword(_newPassword, _PasswordName, _key = null) {
  console.log("Saving Password, please wait...");

  let jsonData = {};
  if (fs.existsSync(datapath)) jsonData = JSON.parse(fs.readFileSync(datapath, 'utf8'));

  const keyToUse = _key !== null ? _key : counter;

  jsonData[keyToUse] = {
    name: _PasswordName,
    createdAt: new Date().toISOString()
  };

  fs.writeFileSync(datapath, JSON.stringify(jsonData, null, 2));

  const data = await encryptData(_newPassword);
  const hexData = ethers.hexlify(data);
  const tx = await contract.setPassword(keyToUse, hexData);
  await tx.wait();

  console.log("Transaction Hash:", tx.hash);

  if (_key === null) counter++;
}

async function getPassword(_key) {
  console.log("Retrieving Password, please wait...");
  const raw = await contract.getPassword(_key);        
  const bytes = Uint8Array.from(Buffer.from(raw.slice(2), 'hex'));
  const password = await decryptData(bytes);
  console.log("Password:", password);
}

async function removePassword(_key) {
  console.log("Deleting Password, please wait...");
  const tx = await contract.deletePassword(_key);
  await tx.wait();
  console.log("Transaction Hash:", tx.hash);

  if (fs.existsSync(datapath)) {
    let jsonData = JSON.parse(fs.readFileSync(datapath, 'utf8'));
    if (jsonData[_key]) {
      delete jsonData[_key];
      fs.writeFileSync(datapath, JSON.stringify(jsonData, null, 2));
      console.log(`Password with key ${_key} removed from JSON file.`);
    } else {
      console.log(`Key ${_key} not found in JSON file.`);
    }
  }
}

async function getPN() {
  if (!fs.existsSync(datapath)) return {};
  return JSON.parse(fs.readFileSync(datapath, 'utf8'));
}

async function sendEther(_to, _amount) {
  console.log("Sending Ethereum, please wait...");
  const tx = await contract.sendETH(_to, await ethers.parseEther(String(_amount)));
  await tx.wait();
  console.log("Transaction Hash:", tx.hash);
}

async function getEther() {
  console.log("Receiving Ethereum, please wait...");
  const tx = await contract.getETH();
  await tx.wait();
  console.log("Transaction Hash:", tx.hash);
}

async function getbalance() {
  console.log("Receiving contract balance, please wait...");
  const balance = await contract.getBalance();
  console.log("Balance:", await ethers.formatEther(balance));
}

async function sendDeposit(_amount) {
  console.log("Sending Ether to the contract, please wait...");
  const tx = await contract.deposit({ value: ethers.parseEther(String(_amount)) });
  await tx.wait();
  console.log("Transaction Hash:", tx.hash);
}

async function updateLogic(_newImplementation) {
  console.log("Updating implementation, please wait...");
  const tx = await contract.upgrade(_newImplementation);
  await tx.wait();
  console.log("Transaction Hash:", tx.hash);
}

module.exports = { setPassword, removePassword, getPN, getPassword, sendEther, getEther, getbalance, sendDeposit, updateLogic };
