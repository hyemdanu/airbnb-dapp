import React, { createContext, useState, useContext } from 'react';

const TransactionLogContext = createContext();

export const useTransactionLog = () => {
  const context = useContext(TransactionLogContext);
  if (!context) {
    throw new Error('useTransactionLog must be used within a TransactionLogProvider');
  }
  return context;
};

let logIdCounter = 0;

export const TransactionLogProvider = ({ children }) => {
  const [logs, setLogs] = useState([]);
  const [isOpen, setIsOpen] = useState(true);

  const addLog = (log) => {
    const timestamp = new Date();
    logIdCounter++;
    const newLog = {
      id: `log-${logIdCounter}-${Date.now()}`,
      timestamp: timestamp.toLocaleTimeString(),
      timestampFull: timestamp.toISOString(),
      ...log
    };
    setLogs(prev => [newLog, ...prev].slice(0, 100));
  };

  const logTransaction = ({
    type,
    method,
    from,
    to,
    value,
    gasUsed,
    txHash,
    status,
    contract,
    params,
    result,
    error,
    blockNumber
  }) => {
    addLog({
      logType: 'transaction',
      type,
      method,
      from,
      to,
      value,
      gasUsed: gasUsed || Math.floor(21000 + Math.random() * 50000),
      txHash: txHash || '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      status: status || 'success',
      contract,
      params,
      result,
      error,
      blockNumber: blockNumber || Math.floor(1000000 + Math.random() * 100000)
    });
  };

  const logStateChange = ({
    contract,
    variable,
    oldValue,
    newValue,
    triggeredBy
  }) => {
    addLog({
      logType: 'stateChange',
      contract,
      variable,
      oldValue,
      newValue,
      triggeredBy
    });
  };

  const logEvent = ({
    contract,
    eventName,
    args,
    txHash
  }) => {
    addLog({
      logType: 'event',
      contract,
      eventName,
      args,
      txHash
    });
  };

  const logAccountChange = ({
    from,
    to,
    balanceChange
  }) => {
    addLog({
      logType: 'accountChange',
      from,
      to,
      balanceChange
    });
  };

  const clearLogs = () => setLogs([]);

  const toggleOpen = () => setIsOpen(prev => !prev);

  const value = {
    logs,
    isOpen,
    addLog,
    logTransaction,
    logStateChange,
    logEvent,
    logAccountChange,
    clearLogs,
    toggleOpen
  };

  return (
    <TransactionLogContext.Provider value={value}>
      {children}
    </TransactionLogContext.Provider>
  );
};
