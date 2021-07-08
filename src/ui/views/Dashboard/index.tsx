import React, { useEffect, useState } from 'react';
import ClipboardJS from 'clipboard';
import QRCode from 'qrcode.react';
import { useHistory } from 'react-router-dom';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import { CHAINS, HARDWARE_KEYRING_TYPES, KEYRING_TYPE } from 'consts';
import { AddressViewer, Modal } from 'ui/component';
import i18n from 'src/i18n';
import { useWallet, getCurrentConnectSite } from 'ui/utils';
import { Account } from 'background/service/preference';
import {
  RecentConnections,
  BalanceView,
  useConfirmExternalModal,
  SwitchAddress,
} from './components';
import IconSetting from 'ui/assets/settings.svg';
import IconCopy from 'ui/assets/copy.svg';
import IconQrcode from 'ui/assets/qrcode.svg';
import IconSend from 'ui/assets/send.svg';
import IconSwap from 'ui/assets/swap.svg';
import IconHistory from 'ui/assets/history.svg';
import IconPending from 'ui/assets/pending.svg';
import IconSuccess from 'ui/assets/success.svg';
import IconHardware from 'ui/assets/hardware-white.svg';
import IconWatch from 'ui/assets/watch-white.svg';
import './style.less';

const Dashboard = () => {
  const history = useHistory();
  const wallet = useWallet();
  const { t } = useTranslation();
  const [currentAccount, setCurrentAccount] = useState<Account | null>(
    wallet.syncGetCurrentAccount()
  );

  if (!currentAccount) {
    history.replace('/no-address');
    return null;
  }

  const [isModalOpen, setModalOpen] = useState(false);
  const [qrcodeVisible, setQrcodeVisible] = useState(false);
  const [pendingTxCount, setPendingTxCount] = useState(0);

  const handleToggle = () => {
    setModalOpen(!isModalOpen);
  };

  const getCurrentAccount = async () => {
    const account = await wallet.getCurrentAccount();
    setCurrentAccount(account);
  };

  const getPendingTxCount = async (address: string) => {
    const { total_count } = await wallet.openapi.getPendingCount(address);
    setPendingTxCount(total_count);
  };

  const _openInTab = useConfirmExternalModal();

  useEffect(() => {
    getPendingTxCount(currentAccount.address);
  }, [currentAccount]);

  useEffect(() => {
    getCurrentAccount();

    const intervalId = setInterval(() => {
      if (!currentAccount) return;
      getPendingTxCount(currentAccount.address);
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const handleConfig = () => {
    history.push('/settings');
  };

  const handleChange = async (account: string, type: string) => {
    await wallet.changeAccount({ address: account, type });
    setCurrentAccount({ address: account, type });
    handleToggle();
  };

  const handleGotoSend = () => {
    _openInTab('https://debank.com/send');
  };

  const handleGotoHistory = () => {
    _openInTab(`https://debank.com/profile/${currentAccount?.address}/history`);
  };

  const handleGotoSwap = async () => {
    const site = await getCurrentConnectSite(wallet);
    let chain: null | string = null;
    if (site) {
      chain = CHAINS[site.chain].serverId;
    }
    _openInTab(`https://debank.com/swap${chain ? `?chain=${chain}` : ''}`);
  };

  const handleCopyCurrentAddress = () => {
    const clipboard = new ClipboardJS('.main', {
      text: function () {
        return currentAccount!.address;
      },
    });

    clipboard.on('success', () => {
      message.success({
        icon: <img src={IconSuccess} className="icon icon-success" />,
        content: t('Copied'),
        duration: 0.5,
      });
      clipboard.destroy();
    });
  };

  const handleShowQrcode = () => {
    setQrcodeVisible(true);
  };

  const hardwareTypes = Object.values(HARDWARE_KEYRING_TYPES).map(
    (item) => item.type
  );

  const handleSwitchLang = () => {
    const lang = i18n.language;
    i18n.changeLanguage(lang === 'en' ? 'zh_CN' : 'en');
  };

  return (
    <>
      <div className="dashboard">
        <div className="main">
          <div className="flex header items-center">
            {(currentAccount?.type === KEYRING_TYPE.WatchAddressKeyring ||
              hardwareTypes.includes(currentAccount!.type)) && (
              <img
                src={
                  currentAccount?.type === KEYRING_TYPE.WatchAddressKeyring
                    ? IconWatch
                    : IconHardware
                }
                className="icon icon-account-type"
              />
            )}
            {currentAccount && (
              <AddressViewer
                address={currentAccount.address}
                onClick={handleToggle}
              />
            )}
            <img
              className="icon icon-copy"
              src={IconCopy}
              onClick={handleCopyCurrentAddress}
            />
            <img
              className="icon icon-qrcode"
              src={IconQrcode}
              onClick={handleShowQrcode}
            />
            <div className="flex-1" />
            <img
              className="icon icon-settings"
              src={IconSetting}
              onClick={handleConfig}
            />
          </div>
          <BalanceView currentAccount={currentAccount} />
          <div className="operation">
            <div className="operation-item" onClick={handleGotoSend}>
              <img className="icon icon-send" src={IconSend} />
              {t('Send')}
            </div>
            <div className="operation-item" onClick={handleGotoSwap}>
              <img className="icon icon-swap" src={IconSwap} />
              {t('Swap')}
            </div>
            <div className="operation-item" onClick={handleGotoHistory}>
              {pendingTxCount > 0 ? (
                <div className="pending-count">
                  <img src={IconPending} className="icon icon-pending" />
                  {pendingTxCount}
                </div>
              ) : (
                <img className="icon icon-history" src={IconHistory} />
              )}
              {t('History')}
            </div>
          </div>
        </div>
        <RecentConnections />
      </div>
      <Modal
        visible={qrcodeVisible}
        closable={false}
        onCancel={() => setQrcodeVisible(false)}
        className="qrcode-modal"
        width="304px"
      >
        <div>
          <QRCode value={currentAccount?.address} size={254} />
          <p
            className="address text-gray-subTitle text-15 font-medium mb-0 font-roboto-mono"
            onClick={handleSwitchLang}
          >
            {currentAccount?.address}
          </p>
        </div>
      </Modal>
      <Modal
        title={t('Set Current Address')}
        visible={isModalOpen}
        width="344px"
        onCancel={handleToggle}
        style={{ margin: 0, padding: 0 }}
      >
        {currentAccount && (
          <SwitchAddress
            currentAccount={currentAccount}
            onChange={handleChange}
          />
        )}
      </Modal>
    </>
  );
};

export default Dashboard;
