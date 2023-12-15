
import contractAbi from "../../shared/contractAbi.json" assert {type: "json"};
import contractAddresses from "../../shared/contractAddresses.json" assert {type: "json"};
import Web3 from "web3";

export const createPendingTransaction = async ({
  networkId,
  functionName,
  params,
  from
}) => {
  const web3 = new Web3("http://127.0.0.1:7545");
  const address = contractAddresses[networkId][0];
  const contract = new web3.eth.Contract(contractAbi, address);
  const data = contract.methods[functionName](...params).encodeABI();

  return {
    from,
    to: address,
    gas: "100000000",
    data: data,
  }
}