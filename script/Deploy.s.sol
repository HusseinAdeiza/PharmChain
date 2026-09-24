pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {ManufacturerCredential} from "../src/ManufacturerCredential.sol";
import {DrugRegistry} from "../src/DrugRegistry.sol";

contract Deploy is Script {
    error WrongChain();

    function run() external returns (ManufacturerCredential credential, DrugRegistry registry) {
        if (block.chainid != 143) revert WrongChain();
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        credential = new ManufacturerCredential();
        registry = new DrugRegistry(address(credential));
        vm.stopBroadcast();
    }
}
