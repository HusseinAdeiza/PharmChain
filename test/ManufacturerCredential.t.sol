pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ManufacturerCredential} from "../src/ManufacturerCredential.sol";

contract ManufacturerCredentialTest is Test {
    ManufacturerCredential private credential;
    address private manufacturer;
    address private recipient;

    function setUp() public {
        credential = new ManufacturerCredential();
        manufacturer = makeAddr("manufacturer");
        recipient = makeAddr("recipient");
    }

    function testMintCreatesVerifiedSoulboundCredential() public {
        uint256 tokenId = credential.mint(manufacturer, "Fidson Healthcare PLC", "A11-0731", "Lagos, Nigeria");

        assertEq(tokenId, 1);
        assertEq(credential.ownerOf(tokenId), manufacturer);
        assertTrue(credential.isVerified(manufacturer));
        assertEq(credential.manufacturerOf(tokenId), manufacturer);

        vm.startPrank(manufacturer);
        vm.expectRevert(ManufacturerCredential.SoulboundToken.selector);
        credential.transferFrom(manufacturer, recipient, tokenId);
        vm.expectRevert(ManufacturerCredential.SoulboundToken.selector);
        credential.safeTransferFrom(manufacturer, recipient, tokenId);
        vm.expectRevert(ManufacturerCredential.SoulboundToken.selector);
        credential.approve(recipient, tokenId);
        vm.expectRevert(ManufacturerCredential.SoulboundToken.selector);
        credential.setApprovalForAll(recipient, true);
        vm.stopPrank();
    }

    function testOwnerCanRevokeCredential() public {
        uint256 tokenId =
            credential.mint(manufacturer, "Emzor Pharmaceutical Industries Limited", "A11-100523", "Lagos, Nigeria");
        credential.revoke(tokenId);

        assertFalse(credential.isVerified(manufacturer));
        assertEq(credential.manufacturerOf(tokenId), address(0));
        vm.expectRevert();
        credential.ownerOf(tokenId);
    }

    function testOnlyOwnerCanMintAndRevoke() public {
        vm.startPrank(manufacturer);
        vm.expectRevert();
        credential.mint(manufacturer, "Unauthorized", "A4-0001", "Lagos");
        vm.stopPrank();

        uint256 tokenId = credential.mint(manufacturer, "Afrab-Chem Limited", "A11-101341", "Lagos");
        vm.startPrank(manufacturer);
        vm.expectRevert();
        credential.revoke(tokenId);
        vm.stopPrank();
    }

    function testPauseBlocksEmergencyMutations() public {
        credential.pause();

        vm.expectRevert();
        credential.mint(manufacturer, "Afrab-Chem Limited", "A11-101341", "Lagos");

        credential.unpause();
        uint256 tokenId = credential.mint(manufacturer, "Afrab-Chem Limited", "A11-101341", "Lagos");
        credential.pause();
        vm.expectRevert();
        credential.revoke(tokenId);
    }
}
