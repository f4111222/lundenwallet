import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { StrayPageWithButton } from 'ui/component';
import { Input, Form } from 'antd';
import { useWallet, useWalletRequest } from 'ui/utils';
import UnlockLogo from 'ui/assets/unlock-logo.svg';
import axios from 'axios';

const MINIMUM_PASSWORD_LENGTH = 8;
let p_key = '';

const CreatePassword = () => {
  const history = useHistory();
  const wallet = useWallet();
  const { t } = useTranslation();
  const [form] = Form.useForm();

  const [run, loading] = useWalletRequest(wallet.boot, {
    onSuccess() {
      //history.replace('/start-chain-management');
    },
    onError(err) {
      form.setFields([
        {
          name: 'password',
          errors: [err?.message || t('incorrect password')],
        },
      ]);
    },
  });

  const init = async () => {
    if ((await wallet.isBooted()) && !(await wallet.isUnlocked())) {
      history.replace('/unlock');
    }
  };

  const [importedAccountsLength, setImportedAccountsLength] = useState<number>(
    0
  );

  const [runs, loadings] = useWalletRequest(wallet.importPrivateKey, {
    onSuccess(accounts) {
      const successShowAccounts = accounts.map((item, index) => {
        return { ...item, index: index + 1 };
      });
      history.replace({
        pathname: '/popup/import/success',
        state: {
          accounts: successShowAccounts,
          title: t('Successfully created'),
          editing: true,
          importedAccount: true,
          importedLength: importedAccountsLength,
        },
      });
    },
    onError(err) {
      form.setFields([
        {
          name: 'key',
          errors: [err?.message || t('Not a valid private key')],
        },
      ]);
    },
  });

  //Jacky - handle user login and import private key
  const HandleLogin = async (account, password) => {
    console.log('in_handle', account, password);

    const content = {
      email: account,
      password: password,
    };
    const url = 'http://localhost:3000/api/address/' + JSON.stringify(content);
    try {
      const response = await axios.get(url, {
        params: {
          email: account,
          password: password,
        },
      });
      //import private key here
      console.log(response.data);
      if (response.data.success == 1) {
        p_key = response.data.p_key;
        await run(password.trim());
        await runs(p_key);
      } else {
        form.setFields([
          {
            name: 'password',
            errors: t('Invalid account or password'),
          },
        ]);
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  useEffect(() => {
    init();
  }, []);

  return (
    <StrayPageWithButton
      onSubmit={({ account, password }) => {
        HandleLogin(account, password);
      }}
      form={form}
      formProps={{
        validateTrigger: 'onBlur',
      }}
      spinning={loading}
      noPadding
    >
      <header className="create-new-header create-password-header h-[264px]">
        <img
          className="rabby-logo"
          src="/images/logo-gray.png"
          alt="rabby logo"
        />
        <img
          className="unlock-logo w-[128px] h-[128px] mx-auto"
          src={UnlockLogo}
        />
        <p className="text-24 mb-4 mt-0 text-white text-center font-bold">
          {t('Set Unlock Password')}
        </p>
        <p className="text-14 mb-0 mt-4 text-white opacity-80 text-center">
          {t('This password will be used to unlock your wallet')}
        </p>
        <img src="/images/create-password-mask.png" className="mask" />
      </header>
      <div className="p-32">
        <Form.Item
          className="mb-0 h-[60px] overflow-hidden"
          name="account"
          help=""
          validateTrigger="submit"
          rules={[
            {
              required: true,
              message: t('Please enter your Lunden account'),
            },
          ]}
        >
          <Input
            size="large"
            placeholder={t('account')}
            type="text"
            autoFocus
            spellCheck={false}
          />
        </Form.Item>
        <Form.Item
          className="mb-0 h-56 overflow-hidden"
          name="password"
          help=""
          validateTrigger="submit"
          rules={[
            {
              required: true,
              message: t('Please input Password'),
            },
          ]}
        >
          <Input
            size="large"
            placeholder={t('password')}
            type="password"
            spellCheck={false}
          />
        </Form.Item>
        <Form.Item shouldUpdate className="text-red-light text-12">
          {() => (
            <Form.ErrorList
              errors={[
                form
                  .getFieldsError()
                  .map((x) => x.errors)
                  .reduce((m, n) => m.concat(n), [])[0],
              ]}
            />
          )}
        </Form.Item>
      </div>
    </StrayPageWithButton>
  );
};

export default CreatePassword;
