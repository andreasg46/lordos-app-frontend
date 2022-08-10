import React, { useEffect, useState } from 'react'
import { CContainer } from '@coreui/react-pro';
import { useNavigate } from 'react-router-dom';
import { cilSearch } from '@coreui/icons';
import CIcon from '@coreui/icons-react';
import { CCard, CCardBody, CCardGroup, CCol, CForm, CFormInput, CImage, CInputGroup, CInputGroupText, CLoadingButton, CRow } from '@coreui/react-pro'
import { GetApi, PutApi } from '../services/Axios';
import { api_server_url, app_url } from 'src/config/urls';
import { Alert, Alert2 } from '../services/Alerts';
import { getCookie, resetCookies, setCookie } from '../services/Cookies';
import OneSignal from 'react-onesignal';
import { AddTags, SendPushBySession } from '../services/OneSignalServer';
import { currentTime, today } from 'src/helpers';

const Landing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    resetCookies();
  }, []);

  const [userId, setUserId] = useState(''); // One Signal

  const [loader, setLoader] = useState(false);
  const [code, setCode] = useState('');
  const [buttonText, setButtonText] = useState('Join');
  const [buttonStatus, setButtonStatus] = useState(false);

  var day = new Date();
  var start_date = day.toLocaleString();
  var end_date = day.getTime() + 7 * 24 * 60 * 60 * 1000; // End date time
  end_date = new Date(end_date);

  OneSignal.getUserId(function (userId) {
    setUserId(userId);
  });

  const findSession = (e) => { // Retrieve user session
    e.preventDefault();

    setLoader(true);

    GetApi(api_server_url + '/session/user/' + code)
      .then(function (value) {
        if (value) {
          Alert('Session found!', 'success')

          setCookie('session_id', value.id, 180);
          setCookie('is_admin', (value.id === 1000) ? true : false, '180');

          PutApi(api_server_url + '/session/update/' + value.id + '/' + code, { activated: true });

          AddTags(userId, value.id, code);

          GetApi(api_server_url + '/session/' + value.id) // Get all sessions and do the checks
            .then(function (value) {
              if (value) {
                setButtonText('Waiting for others to join...'); // Wait for others to join
                setButtonStatus(true);
                openListener();
              }
            })
        } else {
          Alert2('Session not found!', 'error');
          setLoader(false);
        }
      });
  }

  const findUser = (e) => { // Retrieve user session
    e.preventDefault();

    setLoader(true);

    GetApi(api_server_url + '/user/' + code)
      .then(function (value) {
        if (value) {
          GetApi(api_server_url + '/role/' + value.RoleId)
            .then(function (value) {
              if (value) {
                console.log(value);
                setCookie('role', value.title, 180);
              } else {
                setCookie('role', 'N/A', 180);
              }
            })
        }
        setLoader(false);
      });
  }

  function openListener() { // Check if all users are activated and update db
    const interval = setInterval(() => {
      GetApi(api_server_url + '/session/count/' + getCookie('session_id'))
        .then(function (value) {
          if (value) {
            if (value.count === 0) { // Check if session has all members joined
              PutApi(api_server_url + '/sessions/update/' + getCookie('session_id'), { start_date: start_date, end_date: end_date, status: 'Active' });
              setCookie('status', 'Active', 180);
              setLoader(false);
              Alert2('Session established!', 'success');

              // Start Push Server Campaign
              const headings = 'Knock Knock!'
              const subtitle = 'Questions are now available!';
              const campaign = 'Default Campaign';
              const topic = 'Default Topic';
              const clickUrl = app_url.concat('/#/questions');

              const startDate = today;
              const tomorrow = new Date(startDate);
              tomorrow.setDate(tomorrow.getDate() + 1);

              const total_days = 7;

              const deliveryTimeA = '09:00';
              const deliveryTimeB = '14:00';
              const deliveryTimeC = '18:00';

              let test = new Date();

              for (let i = 0; i < 2; i++) {

                // Test Campaign
                SendPushBySession(getCookie('session_id'), headings, subtitle, campaign, new Date(test), topic, clickUrl.concat('?phase=').concat('A'));
                test.setMinutes(test.getMinutes() + 2);
                console.log(test);
              }

              // for (let i = 0; i < total_days; i++) {
              //   const [next] = tomorrow.toISOString().split('T');

              //   // Phase A Campaign
              //   SendPushBySession(getCookie('session_id'), headings, subtitle, campaign, new Date(next + ', ' + deliveryTimeA), topic, clickUrl.concat('&phase=').concat('A'));
              //   // Phase B Campaign
              //   SendPushBySession(getCookie('session_id'), headings, subtitle, campaign, new Date(next + ', ' + deliveryTimeB), topic, clickUrl.concat('&phase=').concat('A'));
              //   // Phase C Campaign
              //   SendPushBySession(getCookie('session_id'), headings, subtitle, campaign, new Date(next + ', ' + deliveryTimeC), topic, clickUrl.concat('&phase=').concat('A'));

              //   tomorrow.setDate(tomorrow.getDate() + 1)
              // }

              setLoader(false);
              navigate('/');
              clearInterval(interval);
            }
          }
        })
    }, 4000);
  }

  const handleInput = (e) => {
    setCookie('code', e.target.value.toUpperCase(), 180);
    setCode(e.target.value.toUpperCase());
  }

  const handleSubmit = (e) => {
    setLoader(true);
    findSession(e);
    findUser(e);
  }

  return (
    <>
      <div className="bg-light min-vh-100 d-flex flex-row align-items-center">
        <CContainer>
          <CRow className="justify-content-center">
            <CCol md={8} lg={8}>
              <CCardGroup>

                <CRow style={{ verticalAlign: 'baseline' }} >
                  <CCard className='landing-card-lg' style={{ writingMode: 'vertical-rl', background: '#014d4d' }}>
                    <CCardBody className="text-center" >
                      <CImage src='logo.png' style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                    </CCardBody>
                  </CCard>
                </CRow>

                <CCard className="p-6 bg-white text-black">
                  <CCardBody>
                    <CImage rounded={true} src='logo-2.png' className='landing-card' style={{ width: '30%', objectFit: 'cover' }} />
                    <br className='landing-card' ></br>
                    <CForm onSubmit={handleSubmit}>
                      <h4>Welcome to Lordos App</h4>
                      <p style={{ color: '#c4c9d0' }}>Get your session</p>
                      <CInputGroup className="mb-3">
                        <CInputGroupText>
                          Code
                        </CInputGroupText>
                        <CFormInput placeholder="Enter your code"
                          onChange={handleInput}
                        />
                      </CInputGroup>
                      <CRow>
                        <CCol style={{ textAlign: 'end', margin: '20px 0 0 0' }}>
                          <CLoadingButton
                            color='success'
                            spinnerType='grow'
                            loading={loader}
                            variant='outline'
                            disabled={buttonStatus}
                            type='submit'
                          ><CIcon icon={cilSearch} /> {buttonText}
                          </CLoadingButton>
                        </CCol>
                      </CRow>
                    </CForm>
                  </CCardBody>
                </CCard>
              </CCardGroup>
            </CCol>
          </CRow>
        </CContainer>
      </div>
    </>
  )
}

export default Landing