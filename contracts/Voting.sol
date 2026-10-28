// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

/// @title Voting
/// @notice One address, one vote. The chairperson registers candidates.
contract Voting {
    struct Candidate {
        string name;
        uint256 votes;
    }

    address public chairperson;
    Candidate[] public candidates;
    mapping(address => bool) public hasVoted;

    event Voted(address indexed voter, uint256 indexed candidateId, string name);
    event CandidateAdded(uint256 indexed id, string name);

    modifier onlyChairperson() {
        require(msg.sender == chairperson, "Voting: caller is not the chairperson");
        _;
    }

    constructor(string[] memory names) {
        chairperson = msg.sender;
        for (uint256 i = 0; i < names.length; i++) {
            candidates.push(Candidate(names[i], 0));
            emit CandidateAdded(i, names[i]);
        }
    }

    function candidateCount() external view returns (uint256) {
        return candidates.length;
    }

    function addCandidate(string calldata name) external onlyChairperson {
        require(bytes(name).length > 0, "Voting: empty candidate name");
        candidates.push(Candidate(name, 0));
        emit CandidateAdded(candidates.length - 1, name);
    }

    function vote(uint256 candidateId) external {
        require(!hasVoted[msg.sender], "Voting: address has already voted");
        require(candidateId < candidates.length, "Voting: unknown candidate");
        hasVoted[msg.sender] = true;
        candidates[candidateId].votes += 1;
        emit Voted(msg.sender, candidateId, candidates[candidateId].name);
    }
}
