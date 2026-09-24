pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ManufacturerCredential} from "../src/ManufacturerCredential.sol";
import {DrugRegistry} from "../src/DrugRegistry.sol";

contract DrugRegistryTest is Test {
    ManufacturerCredential private credential;
    DrugRegistry private registry;
    address private manufacturer;
    address private otherManufacturer;
    address private reporter;
    uint256 private constant TOKEN_ID = 1;
    bytes32 private constant EVIDENCE_HASH = keccak256("nafdac-alert-evidence");

    function setUp() public {
        credential = new ManufacturerCredential();
        registry = new DrugRegistry(address(credential));
        manufacturer = makeAddr("manufacturer");
        otherManufacturer = makeAddr("otherManufacturer");
        reporter = makeAddr("reporter");
        credential.mint(manufacturer, "Fidson Healthcare PLC", "A11-0731", "Lagos, Nigeria");
        credential.mint(otherManufacturer, "Emzor Pharmaceutical Industries Limited", "A11-100523", "Lagos, Nigeria");
    }

    function testAttestBatchAndReadPassport() public {
        uint256 expiry = block.timestamp + 365 days;
        uint256 batchId = _attest(1, "PC-001", expiry);

        DrugRegistry.Passport memory passport;
        uint256[] memory batchIds;
        uint256[] memory reportIds;
        (passport, batchIds, reportIds) = registry.getDrugPassport("A11-0731");

        assertTrue(passport.exists);
        assertEq(passport.nafdacNumber, "A11-0731");
        assertEq(passport.batchCount, 1);
        assertEq(passport.recalledCount, 0);
        assertEq(batchIds.length, 1);
        assertEq(batchIds[0], batchId);
        assertEq(reportIds.length, 0);

        DrugRegistry.Batch memory batch = registry.getBatch(batchId);
        assertEq(batch.manufacturerId, TOKEN_ID);
        assertEq(batch.manufacturer, manufacturer);
        assertEq(batch.nafdacNumber, "A11-0731");
        assertEq(batch.batchNumber, "PC-001");
        assertEq(batch.drugName, "Paracetamol 500mg");
        assertEq(batch.expiryDate, expiry);
        assertEq(batch.evidenceHash, EVIDENCE_HASH);
        assertFalse(batch.recalled);
    }

    function testHistoricalBatchCanBeRecordedForRecall() public {
        uint256 batchId = _attest(1, "DC.319", 1);
        DrugRegistry.Batch memory batch = registry.getBatch(batchId);
        assertEq(batch.expiryDate, 1);
        registry.flagRecall(batchId, "NAFDAC alert 041/2022");
        DrugRegistry.Passport memory passport;
        (passport,,) = registry.getDrugPassport("A11-0731");
        assertEq(passport.recalledCount, 1);
    }

    function testOnlyCredentialHolderCanAttest() public {
        vm.expectRevert(DrugRegistry.NotVerifiedManufacturer.selector);
        vm.prank(otherManufacturer);
        registry.attestBatch(
            TOKEN_ID, "A11-0731", "PC-002", "Paracetamol 500mg", block.timestamp + 365 days, EVIDENCE_HASH
        );
    }

    function testAttesterAndOwnerCanRecall() public {
        uint256 batchId = _attest(1, "PC-001", block.timestamp + 365 days);

        vm.prank(manufacturer);
        registry.flagRecall(batchId, "NAFDAC alert: substandard product");
        DrugRegistry.Batch memory recalledBatch = registry.getBatch(batchId);
        assertTrue(recalledBatch.recalled);
        assertEq(recalledBatch.recallReason, "NAFDAC alert: substandard product");

        uint256 secondBatchId = _attest(1, "PC-002", block.timestamp + 365 days);
        registry.flagRecall(secondBatchId, "Owner emergency action");
        assertTrue(registry.getBatch(secondBatchId).recalled);
    }

    function testUnauthorizedRecallReverts() public {
        uint256 batchId = _attest(1, "PC-001", block.timestamp + 365 days);
        vm.prank(reporter);
        vm.expectRevert(DrugRegistry.NotRecallAuthority.selector);
        registry.flagRecall(batchId, "Unverified report");
    }

    function testCounterfeitReportRequiresOwnerValidation() public {
        uint256 reportId = _report("A11-0731", "Packaging shows a different manufacturing address");
        DrugRegistry.CounterfeitReport memory report = registry.getCounterfeitReport(reportId);
        assertFalse(report.validated);

        registry.validateCounterfeit(reportId, true);
        report = registry.getCounterfeitReport(reportId);
        assertTrue(report.validated);
        assertTrue(report.isCounterfeit);
        assertEq(report.validator, address(this));

        DrugRegistry.Passport memory passport;
        uint256[] memory reportIds;
        (passport,, reportIds) = registry.getDrugPassport("A11-0731");
        assertEq(passport.validatedCounterfeitCount, 1);
        assertEq(reportIds.length, 1);
        assertEq(reportIds[0], reportId);
    }

    function testNonOwnerCannotValidateReport() public {
        uint256 reportId = _report("A11-0731", "Suspected counterfeit");
        vm.prank(reporter);
        vm.expectRevert();
        registry.validateCounterfeit(reportId, true);
    }

    function testDuplicateBatchIsRejected() public {
        _attest(1, "PC-001", block.timestamp + 365 days);
        vm.prank(manufacturer);
        vm.expectRevert(DrugRegistry.BatchAlreadyExists.selector);
        registry.attestBatch(1, "A11-0731", "PC-001", "Paracetamol 500mg", block.timestamp + 365 days, EVIDENCE_HASH);
    }

    function testPauseBlocksRegistryMutations() public {
        registry.pause();
        vm.prank(manufacturer);
        vm.expectRevert();
        registry.attestBatch(1, "A11-0731", "PC-001", "Paracetamol 500mg", block.timestamp + 365 days, EVIDENCE_HASH);
        vm.expectRevert();
        registry.flagCounterfeit("A11-0731", "Suspected counterfeit");
        registry.unpause();
    }

    function testRevokedCredentialCannotAttest() public {
        credential.revoke(TOKEN_ID);
        vm.prank(manufacturer);
        vm.expectRevert(DrugRegistry.NotVerifiedManufacturer.selector);
        registry.attestBatch(
            TOKEN_ID, "A11-0731", "PC-001", "Paracetamol 500mg", block.timestamp + 365 days, EVIDENCE_HASH
        );
    }

    function _attest(uint256 credentialId, string memory batchNumber, uint256 expiry) private returns (uint256) {
        vm.prank(manufacturer);
        return registry.attestBatch(credentialId, "A11-0731", batchNumber, "Paracetamol 500mg", expiry, EVIDENCE_HASH);
    }

    function _report(string memory nrn, string memory details) private returns (uint256) {
        vm.prank(reporter);
        return registry.flagCounterfeit(nrn, details);
    }
}
