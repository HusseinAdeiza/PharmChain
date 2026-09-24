pragma solidity ^0.8.24;

import {ERC721} from "openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";
import {Pausable} from "openzeppelin-contracts/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import {IManufacturerCredential} from "./IManufacturerCredential.sol";

contract ManufacturerCredential is ERC721, Ownable, Pausable, ReentrancyGuard, IManufacturerCredential {
    struct Credential {
        string manufacturerName;
        string nafdacRegistrationNumber;
        string manufacturingAddress;
        address manufacturer;
        bool active;
        uint64 issuedAt;
        uint64 revokedAt;
    }

    uint256 public constant MAX_TEXT_LENGTH = 256;
    uint256 public nextTokenId = 1;

    mapping(uint256 tokenId => Credential credential) private _credentials;
    mapping(address manufacturer => uint256 tokenId) private _credentialOf;

    error CredentialAlreadyExists();
    error CredentialDoesNotExist();
    error EmptyText();
    error InvalidManufacturer();
    error SoulboundToken();
    error TextTooLong();

    event CredentialMinted(
        uint256 indexed tokenId,
        address indexed manufacturer,
        string manufacturerName,
        string nafdacRegistrationNumber,
        string manufacturingAddress
    );
    event CredentialRevoked(uint256 indexed tokenId, address indexed manufacturer, string reason);

    constructor() ERC721("PharmChain Manufacturer Credential", "PCMC") Ownable(msg.sender) {}

    function mint(
        address manufacturer,
        string calldata manufacturerName,
        string calldata nafdacRegistrationNumber,
        string calldata manufacturingAddress
    ) external onlyOwner whenNotPaused nonReentrant returns (uint256 tokenId) {
        if (manufacturer == address(0)) revert InvalidManufacturer();
        if (_credentialOf[manufacturer] != 0) revert CredentialAlreadyExists();
        _validateText(manufacturerName);
        _validateText(nafdacRegistrationNumber);
        _validateText(manufacturingAddress);

        tokenId = nextTokenId++;
        _mint(manufacturer, tokenId);
        _credentials[tokenId] = Credential({
            manufacturerName: manufacturerName,
            nafdacRegistrationNumber: nafdacRegistrationNumber,
            manufacturingAddress: manufacturingAddress,
            manufacturer: manufacturer,
            active: true,
            issuedAt: uint64(block.timestamp),
            revokedAt: 0
        });
        _credentialOf[manufacturer] = tokenId;
        emit CredentialMinted(tokenId, manufacturer, manufacturerName, nafdacRegistrationNumber, manufacturingAddress);
    }

    function revoke(uint256 tokenId) external onlyOwner whenNotPaused nonReentrant {
        Credential storage credential = _credentials[tokenId];
        if (credential.manufacturer == address(0) || !credential.active) revert CredentialDoesNotExist();
        address manufacturer = credential.manufacturer;
        credential.active = false;
        credential.revokedAt = uint64(block.timestamp);
        delete _credentialOf[manufacturer];
        _burn(tokenId);
        emit CredentialRevoked(tokenId, manufacturer, "License revoked by contract owner");
    }

    function pause() external onlyOwner nonReentrant {
        _pause();
    }

    function unpause() external onlyOwner nonReentrant {
        _unpause();
    }

    function isVerified(address manufacturer) public view returns (bool) {
        uint256 tokenId = _credentialOf[manufacturer];
        if (tokenId == 0) return false;
        Credential storage credential = _credentials[tokenId];
        return credential.active && credential.manufacturer == manufacturer;
    }

    function manufacturerOf(uint256 tokenId) external view returns (address) {
        Credential storage credential = _credentials[tokenId];
        if (!credential.active) return address(0);
        return credential.manufacturer;
    }

    function getCredential(uint256 tokenId) external view returns (Credential memory) {
        Credential storage credential = _credentials[tokenId];
        if (credential.manufacturer == address(0)) revert CredentialDoesNotExist();
        return credential;
    }

    function tokenURI(uint256) public pure override returns (string memory) {
        return "";
    }

    function approve(address, uint256) public pure override {
        revert SoulboundToken();
    }

    function setApprovalForAll(address, bool) public pure override {
        revert SoulboundToken();
    }

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert SoulboundToken();
        return super._update(to, tokenId, auth);
    }

    function _validateText(string calldata value) private pure {
        if (bytes(value).length == 0) revert EmptyText();
        if (bytes(value).length > MAX_TEXT_LENGTH) revert TextTooLong();
    }
}
