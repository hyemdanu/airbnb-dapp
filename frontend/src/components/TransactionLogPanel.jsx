import React from 'react';
import { useTransactionLog } from '../context/TransactionLogContext';
import { useWeb3 } from '../context/Web3Context';
import { Panel } from 'primereact/panel';
import { Button } from 'primereact/button';
import { ScrollPanel } from 'primereact/scrollpanel';

const TransactionLogPanel = () => {
  const { logs, isOpen, clearLogs, toggleOpen } = useTransactionLog();
  const { account, accountInfo, networkId, blockNumber } = useWeb3();

  const formatAddress = (addr) => {
    if (!addr) return 'N/A';
    return addr.substring(0, 8) + '...' + addr.substring(addr.length - 6);
  };

  const renderLog = (log) => (
    <div key={log.id} className="p-2 mb-2 surface-100 border-round text-sm">
      <div className="flex justify-content-between mb-1">
        <strong>{log.method || log.type || 'Transaction'}</strong>
        <span className="text-500">{log.timestamp}</span>
      </div>
      {log.from && <div>From: {formatAddress(log.from)}</div>}
      {log.to && <div>To: {formatAddress(log.to)}</div>}
      {log.value && log.value !== '0' && <div>Value: {log.value}</div>}
      {log.gasUsed && <div>Gas: {log.gasUsed}</div>}
      {log.txHash && <div>Tx: {log.txHash.substring(0, 16)}...</div>}
      {log.status && <div>Status: {log.status}</div>}
      {log.error && <div className="text-red-500">Error: {log.error}</div>}
    </div>
  );

  const header = (
    <div className="flex justify-content-between align-items-center w-full">
      <span>Transaction Log ({logs.length})</span>
      <Button
        icon="pi pi-trash"
        size="small"
        text
        onClick={(e) => { e.stopPropagation(); clearLogs(); }}
      />
    </div>
  );

  return (
    <div className="fixed bottom-0 right-0 m-3" style={{ width: '320px', maxHeight: '80vh', zIndex: 1000 }}>
      <Panel
        header={header}
        toggleable
        collapsed={!isOpen}
        onToggle={toggleOpen}
      >
        <div className="mb-3 p-2 surface-100 border-round text-sm">
          <div><strong>Account:</strong> {accountInfo?.name || 'Unknown'}</div>
          <div className="text-xs">{formatAddress(account)}</div>
          <div>Balance: {accountInfo?.balance?.toFixed(4) || '0'} ETH</div>
          <div>Network: {networkId || 'N/A'}</div>
          <div>Block: {blockNumber || 'N/A'}</div>
        </div>

        <ScrollPanel style={{ width: '100%', height: '250px' }}>
          {logs.length === 0 ? (
            <div className="text-center text-500 p-3">
              No transactions yet
            </div>
          ) : (
            logs.map(log => renderLog(log))
          )}
        </ScrollPanel>
      </Panel>
    </div>
  );
};

export default TransactionLogPanel;
