// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Safebox {
    bytes32 private constant _OWNER_SLOT =
        0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103;
    bytes32 private constant _IMPLEMENTATION_SLOT =
        0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;

    constructor(address _impl, address _owner) {
        assembly {
            sstore(_OWNER_SLOT, _owner)
            sstore(_IMPLEMENTATION_SLOT, _impl)
        }
    }

    modifier onlyOwner() {
        require(msg.sender == _getAdmin(), "you are not owner!");
        _;
    }

    function _getAdmin() internal view returns (address adm) {
        assembly {
            adm := sload(_OWNER_SLOT)
        }
    }

    function _getImplementation() internal view returns (address impl) {
        assembly {
            impl := sload(_IMPLEMENTATION_SLOT)
        }
    }

    function upgrade(address _newImplementation) external onlyOwner {
        assembly {
            sstore(_IMPLEMENTATION_SLOT, _newImplementation)
        }
    }

    fallback() external onlyOwner payable {
        address impl = _getImplementation();

        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), impl, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())

            switch result
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }

    receive() external payable {}

    function deposit() external payable { }

    function getETH() external onlyOwner {
        (bool success, ) = payable(msg.sender).call{value: address(this).balance}("");
        require(success, "Failed to send Ether");
    }

    function sendETH(address payable _to, uint256 _amount) external onlyOwner {
        (bool success, ) = _to.call{value: _amount}("");
        require(success, "Failed to send Ether");
    }

    function getBalance() external view onlyOwner returns (uint256) {
        return address(this).balance;
    }
}
