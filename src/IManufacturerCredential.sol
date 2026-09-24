pragma solidity ^0.8.24;

interface IManufacturerCredential {
    function isVerified(address manufacturer) external view returns (bool);

    function manufacturerOf(uint256 tokenId) external view returns (address);
}
