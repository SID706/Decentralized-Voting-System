// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

contract Voting {
    struct Candidate {
        string name;
        uint256 votes;
    }

    Candidate[] public candidates;
    mapping(address => bool) public hasVoted;

    event Voted(address indexed voter, uint256 indexed candidateId);

    constructor(string[] memory candidateNames) {
        require(candidateNames.length > 0, "No candidates");
        for (uint256 i = 0; i < candidateNames.length; i++) {
            candidates.push(Candidate(candidateNames[i], 0));
        }
    }

    function vote(uint256 candidateId) public {
        require(!hasVoted[msg.sender], "Already voted");
        require(candidateId < candidates.length, "Invalid candidate");
        hasVoted[msg.sender] = true;
        candidates[candidateId].votes += 1;
        emit Voted(msg.sender, candidateId);
    }

    function getCandidates() public view returns (Candidate[] memory) {
        return candidates;
    }

    function candidateCount() public view returns (uint256) {
        return candidates.length;
    }

    function totalVotes() public view returns (uint256 total) {
        for (uint256 i = 0; i < candidates.length; i++) {
            total += candidates[i].votes;
        }
    }

    function getWinner() public view returns (string memory winnerName, uint256 votes) {
        for (uint256 i = 0; i < candidates.length; i++) {
            if (candidates[i].votes > votes) {
                votes = candidates[i].votes;
                winnerName = candidates[i].name;
            }
        }
    }
}
