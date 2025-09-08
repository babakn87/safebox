// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Implementation {

    mapping(uint256 => bool) savedPasswords;
    mapping(uint256 => bytes) Storage;

    function setPassword(uint256 _key , bytes memory _data) external {
        require(savedPasswords[_key] == false , "This key has already been used.");
        Storage[_key] = _data;
        savedPasswords[_key] = true;
    }

    function deletePassword(uint256 _key) external {
        require(savedPasswords[_key] == true , "There is no value for this key.");
        Storage[_key] = "";
        savedPasswords[_key] = false;
    } 

    function getPassword(uint256 _key) external view returns(bytes memory) {
        return Storage[_key];
    }
}