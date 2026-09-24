pragma solidity ^0.8.24;

import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";
import {Pausable} from "openzeppelin-contracts/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import {IManufacturerCredential} from "./IManufacturerCredential.sol";

contract DrugRegistry is Ownable, Pausable, ReentrancyGuard {
    struct Batch {
        uint256 batchId;
        uint256 manufacturerId;
        address manufacturer;
        string nafdacNumber;
        string batchNumber;
        string drugName;
        uint256 expiryDate;
        bytes32 evidenceHash;
        address attestedBy;
        uint256 attestedAt;
        bool recalled;
        string recallReason;
        uint256 recalledAt;
        address recalledBy;
    }

    struct CounterfeitReport {
        uint256 reportId;
        string nafdacNumber;
        string details;
        address reporter;
        uint256 reportedAt;
        bool validated;
        bool isCounterfeit;
        address validator;
        uint256 validatedAt;
    }

    struct Passport {
        bool exists;
        string nafdacNumber;
        uint256 batchCount;
        uint256 recalledCount;
        uint256 counterfeitReportCount;
        uint256 pendingReportCount;
        uint256 validatedCounterfeitCount;
    }

    uint256 public constant MAX_TEXT_LENGTH = 512;
    uint256 public constant MAX_DETAILS_LENGTH = 2048;
    uint256 public constant MAX_PASSPORT_ITEMS = 100;
    uint256 public nextBatchId = 1;
    uint256 public nextReportId = 1;

    IManufacturerCredential public immutable credentialContract;

    mapping(uint256 batchId => Batch batch) private _batches;
    mapping(uint256 reportId => CounterfeitReport report) private _reports;
    mapping(uint256 batchId => bool exists) private _batchExists;
    mapping(uint256 reportId => bool exists) private _reportExists;
    mapping(bytes32 nafdacKey => uint256[] batchIds) private _batchIdsByNafdac;
    mapping(bytes32 nafdacKey => uint256[] reportIds) private _reportIdsByNafdac;
    mapping(bytes32 batchKey => uint256 batchId) private _batchIdByKey;
    mapping(bytes32 reportKey => bool exists) private _reportExistsByKey;
    mapping(bytes32 nafdacKey => uint256 count) private _recalledCountByNafdac;
    mapping(bytes32 nafdacKey => uint256 count) private _pendingReportCountByNafdac;
    mapping(bytes32 nafdacKey => uint256 count) private _validatedCounterfeitCountByNafdac;

    error BatchAlreadyExists();
    error BatchDoesNotExist();
    error DuplicateReport();
    error EmptyText();
    error EvidenceHashMissing();
    error InvalidCredential();
    error InvalidExpiry();
    error InvalidLimit();
    error NotRecallAuthority();
    error NotVerifiedManufacturer();
    error ReportAlreadyValidated();
    error ReportDoesNotExist();
    error TextTooLong();
    error BatchAlreadyRecalled();

    event BatchAttested(
        uint256 indexed batchId,
        uint256 indexed manufacturerId,
        address indexed attestor,
        string nafdacNumber,
        string batchNumber,
        string drugName,
        uint256 expiryDate,
        bytes32 evidenceHash
    );
    event BatchRecalled(uint256 indexed batchId, address indexed caller, string reason);
    event CounterfeitFlagged(uint256 indexed reportId, address indexed reporter, string nafdacNumber, string details);
    event CounterfeitValidated(uint256 indexed reportId, address indexed validator, bool isCounterfeit);

    constructor(address credentialAddress) Ownable(msg.sender) {
        if (credentialAddress == address(0)) revert InvalidCredential();
        credentialContract = IManufacturerCredential(credentialAddress);
    }

    function attestBatch(
        uint256 manufacturerId,
        string calldata nafdacNumber,
        string calldata batchNumber,
        string calldata drugName,
        uint256 expiryDate,
        bytes32 evidenceHash
    ) external whenNotPaused nonReentrant returns (uint256 batchId) {
        if (
            !credentialContract.isVerified(msg.sender)
                || credentialContract.manufacturerOf(manufacturerId) != msg.sender
        ) {
            revert NotVerifiedManufacturer();
        }
        _validateText(nafdacNumber);
        _validateText(batchNumber);
        _validateText(drugName);
        if (expiryDate == 0) revert InvalidExpiry();
        if (evidenceHash == bytes32(0)) revert EvidenceHashMissing();

        bytes32 nafdacKey = keccak256(bytes(nafdacNumber));
        bytes32 batchKey = keccak256(abi.encode(nafdacNumber, batchNumber));
        if (_batchIdByKey[batchKey] != 0) revert BatchAlreadyExists();

        batchId = nextBatchId++;
        _batches[batchId] = Batch({
            batchId: batchId,
            manufacturerId: manufacturerId,
            manufacturer: msg.sender,
            nafdacNumber: nafdacNumber,
            batchNumber: batchNumber,
            drugName: drugName,
            expiryDate: expiryDate,
            evidenceHash: evidenceHash,
            attestedBy: msg.sender,
            attestedAt: block.timestamp,
            recalled: false,
            recallReason: "",
            recalledAt: 0,
            recalledBy: address(0)
        });
        _batchExists[batchId] = true;
        _batchIdsByNafdac[nafdacKey].push(batchId);
        _batchIdByKey[batchKey] = batchId;
        emit BatchAttested(
            batchId, manufacturerId, msg.sender, nafdacNumber, batchNumber, drugName, expiryDate, evidenceHash
        );
    }

    function flagRecall(uint256 batchId, string calldata reason) external whenNotPaused nonReentrant {
        Batch storage batch = _batches[batchId];
        if (batch.attestedBy == address(0)) revert BatchDoesNotExist();
        if (batch.recalled) revert BatchAlreadyRecalled();
        if (msg.sender != batch.manufacturer && msg.sender != owner()) revert NotRecallAuthority();
        _validateText(reason);

        batch.recalled = true;
        batch.recallReason = reason;
        batch.recalledAt = block.timestamp;
        batch.recalledBy = msg.sender;
        ++_recalledCountByNafdac[keccak256(bytes(batch.nafdacNumber))];
        emit BatchRecalled(batchId, msg.sender, reason);
    }

    function flagCounterfeit(string calldata nafdacNumber, string calldata details)
        external
        whenNotPaused
        nonReentrant
        returns (uint256 reportId)
    {
        _validateText(nafdacNumber);
        _validateDetails(details);
        bytes32 reportKey = keccak256(abi.encode(msg.sender, nafdacNumber, details));
        if (_reportExistsByKey[reportKey]) revert DuplicateReport();
        _reportExistsByKey[reportKey] = true;

        reportId = nextReportId++;
        _reports[reportId] = CounterfeitReport({
            reportId: reportId,
            nafdacNumber: nafdacNumber,
            details: details,
            reporter: msg.sender,
            reportedAt: block.timestamp,
            validated: false,
            isCounterfeit: false,
            validator: address(0),
            validatedAt: 0
        });
        _reportExists[reportId] = true;
        _reportIdsByNafdac[keccak256(bytes(nafdacNumber))].push(reportId);
        ++_pendingReportCountByNafdac[keccak256(bytes(nafdacNumber))];
        emit CounterfeitFlagged(reportId, msg.sender, nafdacNumber, details);
    }

    function validateCounterfeit(uint256 reportId, bool isCounterfeit) external onlyOwner whenNotPaused nonReentrant {
        CounterfeitReport storage report = _reports[reportId];
        if (report.reportId == 0) revert ReportDoesNotExist();
        if (report.validated) revert ReportAlreadyValidated();
        report.validated = true;
        report.isCounterfeit = isCounterfeit;
        report.validator = msg.sender;
        report.validatedAt = block.timestamp;
        bytes32 nafdacKey = keccak256(bytes(report.nafdacNumber));
        if (_pendingReportCountByNafdac[nafdacKey] != 0) --_pendingReportCountByNafdac[nafdacKey];
        if (isCounterfeit) ++_validatedCounterfeitCountByNafdac[nafdacKey];
        emit CounterfeitValidated(reportId, msg.sender, isCounterfeit);
    }

    function pause() external onlyOwner nonReentrant {
        _pause();
    }

    function unpause() external onlyOwner nonReentrant {
        _unpause();
    }

    function getDrugPassport(string calldata nafdacNumber)
        external
        view
        returns (Passport memory passport, uint256[] memory batchIds, uint256[] memory reportIds)
    {
        bytes32 nafdacKey = keccak256(bytes(nafdacNumber));
        uint256[] storage storedBatchIds = _batchIdsByNafdac[nafdacKey];
        uint256[] storage storedReportIds = _reportIdsByNafdac[nafdacKey];
        passport.exists = storedBatchIds.length != 0 || storedReportIds.length != 0;
        passport.nafdacNumber = nafdacNumber;
        passport.batchCount = storedBatchIds.length;
        passport.recalledCount = _recalledCountByNafdac[nafdacKey];
        passport.counterfeitReportCount = storedReportIds.length;
        passport.pendingReportCount = _pendingReportCountByNafdac[nafdacKey];
        passport.validatedCounterfeitCount = _validatedCounterfeitCountByNafdac[nafdacKey];

        uint256 batchLimit = storedBatchIds.length;
        if (batchLimit > MAX_PASSPORT_ITEMS) batchLimit = MAX_PASSPORT_ITEMS;
        batchIds = new uint256[](batchLimit);
        for (uint256 i = 0; i < batchLimit; ++i) {
            uint256 batchId = storedBatchIds[i];
            batchIds[i] = batchId;
        }

        uint256 reportLimit = storedReportIds.length;
        if (reportLimit > MAX_PASSPORT_ITEMS) reportLimit = MAX_PASSPORT_ITEMS;
        reportIds = new uint256[](reportLimit);
        for (uint256 i = 0; i < reportLimit; ++i) {
            uint256 reportId = storedReportIds[i];
            reportIds[i] = reportId;
        }
    }

    function getBatch(uint256 batchId) external view returns (Batch memory) {
        if (!_batchExists[batchId]) revert BatchDoesNotExist();
        return _batches[batchId];
    }

    function getCounterfeitReport(uint256 reportId) external view returns (CounterfeitReport memory) {
        if (!_reportExists[reportId]) revert ReportDoesNotExist();
        return _reports[reportId];
    }

    function getBatchPage(string calldata nafdacNumber, uint256 offset, uint256 limit)
        external
        view
        returns (Batch[] memory page, uint256 nextOffset)
    {
        uint256 boundedLimit = _boundedLimit(limit);
        uint256[] storage ids = _batchIdsByNafdac[keccak256(bytes(nafdacNumber))];
        if (offset >= ids.length) return (new Batch[](0), 0);
        uint256 remaining = ids.length - offset;
        uint256 pageLength = remaining < boundedLimit ? remaining : boundedLimit;
        page = new Batch[](pageLength);
        for (uint256 i = 0; i < pageLength; ++i) {
            page[i] = _batches[ids[offset + i]];
        }
        nextOffset = offset + pageLength < ids.length ? offset + pageLength : 0;
    }

    function getCounterfeitReportPage(string calldata nafdacNumber, uint256 offset, uint256 limit)
        external
        view
        returns (CounterfeitReport[] memory page, uint256 nextOffset)
    {
        uint256 boundedLimit = _boundedLimit(limit);
        uint256[] storage ids = _reportIdsByNafdac[keccak256(bytes(nafdacNumber))];
        if (offset >= ids.length) return (new CounterfeitReport[](0), 0);
        uint256 remaining = ids.length - offset;
        uint256 pageLength = remaining < boundedLimit ? remaining : boundedLimit;
        page = new CounterfeitReport[](pageLength);
        for (uint256 i = 0; i < pageLength; ++i) {
            page[i] = _reports[ids[offset + i]];
        }
        nextOffset = offset + pageLength < ids.length ? offset + pageLength : 0;
    }

    function getTotalBatches() external view returns (uint256) {
        return nextBatchId - 1;
    }

    function getTotalCounterfeitReports() external view returns (uint256) {
        return nextReportId - 1;
    }

    function getBatchId(string calldata nafdacNumber, string calldata batchNumber) external view returns (uint256) {
        return _batchIdByKey[keccak256(abi.encode(nafdacNumber, batchNumber))];
    }

    function _boundedLimit(uint256 limit) private pure returns (uint256) {
        if (limit == 0) revert InvalidLimit();
        return limit > MAX_PASSPORT_ITEMS ? MAX_PASSPORT_ITEMS : limit;
    }

    function _validateText(string calldata value) private pure {
        if (bytes(value).length == 0) revert EmptyText();
        if (bytes(value).length > MAX_TEXT_LENGTH) revert TextTooLong();
    }

    function _validateDetails(string calldata value) private pure {
        if (bytes(value).length == 0) revert EmptyText();
        if (bytes(value).length > MAX_DETAILS_LENGTH) revert TextTooLong();
    }
}
