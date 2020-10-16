import React, { useCallback, useEffect, useState } from 'react'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'
import { Credentials, StringTranslations } from '@crowdin/crowdin-api-client'
import { lightTheme, darkTheme } from './theme'
import { UseWalletProvider } from 'use-wallet'
import DisclaimerModal from './components/DisclaimerModal'
import MobileMenu from './components/MobileMenu'
import TopBar from './components/TopBar'
import GlobalStyle from './components/GlobalStyle'
import FarmsProvider from './contexts/Farms'
import ModalsProvider from './contexts/Modals'
import TransactionProvider from './contexts/Transactions'
import SushiProvider from './contexts/SushiProvider'
import BscProvider from './contexts/BscProvider'
import { EN } from './constants/localisation/languageCodes'
import { allLanguages } from './constants/localisation/languageCodes'
import {
  LanguageContext,
  LanguageObject,
} from './contexts/Localisation/languageContext'
import { TranslationsContext } from './contexts/Localisation/translationsContext'
import useModal from './hooks/useModal'
import useTheme from './hooks/useTheme'
import Farms from './views/Farms'
import Home from './views/Home'
import Stake from './views/Stake'
import Lottery from './views/Lottery'
import Voting from './views/Voting'
import Vision from './views/Vision'
import Syrup from './views/Syrup'

// components
import Web3ReactManager from './components/Web3ReactManager'

const App: React.FC = () => {
  const [isDark, setIsDark] = useTheme()
  const [mobileMenu, setMobileMenu] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<any>(undefined)
  const [translatedLanguage, setTranslatedLanguage] = useState<any>(undefined)
  const [translations, setTranslations] = useState<Array<any>>([])

  const apiKey = `${process.env.REACT_APP_CROWDIN_APIKEY}`
  const projectId = parseInt(`${process.env.REACT_APP_CROWDIN_PROJECTID}`)
  const fileId = 8

  const credentials: Credentials = {
    token: apiKey,
  }

  const stringTranslationsApi = new StringTranslations(credentials)

  const handleDismissMobileMenu = useCallback(() => {
    setMobileMenu(false)
  }, [setMobileMenu])

  const handlePresentMobileMenu = useCallback(() => {
    setMobileMenu(true)
  }, [setMobileMenu])

  const getStoredLang = (storedLangCode: string) => {
    return allLanguages.filter((language) => {
      return language.code === storedLangCode
    })[0]
  }

  useEffect(() => {
    const storedLangCode = localStorage.getItem('pancakeSwapLanguage')
    if (storedLangCode) {
      const storedLang = getStoredLang(storedLangCode)
      setSelectedLanguage(storedLang)
    } else {
      setSelectedLanguage(EN)
    }
  }, [])

  const fetchTranslationsForSelectedLanguage = async () => {
    stringTranslationsApi
      .listLanguageTranslations(
        projectId,
        selectedLanguage.code,
        undefined,
        fileId,
        200,
      )
      .then((translationApiResponse) => {
        if (translationApiResponse.data.length < 1) {
          setTranslations(['error'])
        } else {
          setTranslations(translationApiResponse.data)
        }
      })
      .then(() => setTranslatedLanguage(selectedLanguage))
      .catch((error) => console.error(error))
  }

  useEffect(() => {
    if (selectedLanguage) {
      fetchTranslationsForSelectedLanguage()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLanguage])

  return (
    <Providers
      isDark={isDark}
      selectedLanguage={selectedLanguage}
      setSelectedLanguage={setSelectedLanguage}
      translatedLanguage={translatedLanguage}
      setTranslatedLanguage={setTranslatedLanguage}
      translations={translations}
      setTranslations={setTranslations}
    >
      <Router>
        <GlobalStyle />
        <TopBar
          isDark={isDark}
          toogleTheme={setIsDark}
          onPresentMobileMenu={handlePresentMobileMenu}
        />
        <MobileMenu onDismiss={handleDismissMobileMenu} visible={mobileMenu} />
        <Web3ReactManager>
          <Switch>
            <Route path="/" exact>
              <Home />
            </Route>
            <Route path="/farms">
              <Farms removed={false} />
            </Route>
            <Route path="/staking">
              <Stake />
            </Route>
            <Route path="/syrup">
              <Syrup />
            </Route>
            <Route path="/lottery">
              <Lottery />
            </Route>
            <Route path="/voting">
              <Voting />
            </Route>
            <Route path="/removed">
              <Farms removed={true} />
            </Route>
          </Switch>
        </Web3ReactManager>
      </Router>
      <Disclaimer />
    </Providers>
  )
}

const Providers: React.FC<{
  isDark: boolean
  selectedLanguage: LanguageObject
  setSelectedLanguage: React.Dispatch<React.SetStateAction<LanguageObject>>
  translatedLanguage: LanguageObject
  setTranslatedLanguage: React.Dispatch<React.SetStateAction<LanguageObject>>
  translations: Array<any>
  setTranslations: React.Dispatch<React.SetStateAction<Array<any>>>
}> = ({
  isDark,
  selectedLanguage,
  setSelectedLanguage,
  translatedLanguage,
  setTranslatedLanguage,
  translations,
  setTranslations,
  children,
}) => {
  return (
    <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
      <LanguageContext.Provider
        value={{
          selectedLanguage,
          setSelectedLanguage,
          translatedLanguage,
          setTranslatedLanguage,
        }}
      >
        <TranslationsContext.Provider value={{ translations, setTranslations }}>
          <UseWalletProvider
            chainId={56}
            connectors={{
              walletconnect: { rpcUrl: 'https://bsc-dataseed.binance.org' },
            }}
          >
            <BscProvider>
              <SushiProvider>
                <TransactionProvider>
                  <FarmsProvider>
                    <ModalsProvider>{children}</ModalsProvider>
                  </FarmsProvider>
                </TransactionProvider>
              </SushiProvider>
            </BscProvider>
          </UseWalletProvider>
        </TranslationsContext.Provider>
      </LanguageContext.Provider>
    </ThemeProvider>
  )
}

const Disclaimer: React.FC = () => {
  const markSeen = useCallback(() => {
    localStorage.setItem('disclaimer', 'seen')
  }, [])

  const [onPresentDisclaimerModal] = useModal(
    <DisclaimerModal onConfirm={markSeen} />,
  )

  useEffect(() => {
    const seenDisclaimer = true // localStorage.getItem('disclaimer')
    if (!seenDisclaimer) {
      onPresentDisclaimerModal()
    }
  }, [])

  return <div />
}

export default React.memo(App)