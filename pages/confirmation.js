import { useRouter } from 'next/router'
import { useEffect, useState } from 'react';
import { useCookies, Cookies } from 'react-cookie';

import Layout from '../components/layout'
import Navbar from '../components/navbar'

const axios = require('axios');
const Swal = require('sweetalert2');

export default function Confirmation() {
    const router = useRouter();
    const { issuer, spread } = router.query;
    
    const [cookies, setCookie, removeCookie] = useCookies();
    const [loading, setLoading] = useState(1);
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [retypePassword, setRetypePassword] = useState('');
    const [passcode, setPasscode] = useState('');
    const [secureCodeData, setSecureCodeData] = useState({
        challenge: '',
        token: '',
        issuer: ''
    });
    const [user, setUser] = useState();

    useEffect(() => {
        if (issuer) {
            setPhone(issuer);

            const savedSecureCode = loadSecureCode();

            if (!savedSecureCode && !savedSecureCode?.token) {
                createSecureCode();
            } else {
                setLoading(0);
            }
            
            if ('ks-user' in cookies) {
                const u = cookies['ks-user'];
                setUser(u);
            }
        }
    }, [issuer]);

    /**
     * Load saved securecode
     */
    const loadSecureCode = () => {
        const d = localStorage.getItem('confirmation_' + issuer);
        return d ? JSON.parse(d) : null;
    }

    /**
     * Render error
     */
    const handleError = (errorData) => {
        let message = 'Something wrong!';
            
        if (errorData) {
            // error as object
            if (typeof errorData === 'object') {
                let msgList = [];

                for (let k in errorData) {
                    let e = errorData[k];

                    // Check is array
                    if (Array.isArray(e)) {
                        msgList.push(k.toUpperCase() + ': ' + e.join(' '));
                    } else if (typeof e === 'object') {
                        for (let kk in e) {
                            let ee = e[kk];
                            msgList.push(kk.toUpperCase() + ': ' + ee.join(' '));
                        }
                    } else {
                        msgList.push(k.toUpperCase() + ': ' + e);
                    }
                }

                // Print the message
                message = msgList.join(' ');
            } else {
                // Default errorData
                if (errorData && errorData?.detail) {
                    message = errorData?.detail;
                }
            }
        
            Swal.fire({
                title: 'Kesalahan!',
                text: message,
                icon: 'error',
                confirmButtonText: 'Coba Lagi'
            });
        }
    }

    /**
     * Create or resend secure code
     */
    const createSecureCode = async (isResend = false) => {
        if (isResend) setLoading(0);

        const data = {
            issuer: issuer,
            challenge: 'validate_msisdn',
        }

        axios.post('http://localhost:8000/api/person/v1/securecodes/', data)
        .then((response) => {
            // save session
            localStorage.setItem('confirmation_' + issuer, JSON.stringify(response.data));

            const data = response.data;
            
            setLoading(0);
            setSecureCodeData({
                challenge: data.challenge,
                token: data.token,
                issuer: data.issuer,
            });
        })
        .catch((error) => {
            const errorData = error?.response?.data;
            handleError(errorData);
        });
    }

    /**
     * Validate secure code
     */
    const validateSecureCode = async () => {
        const d = loadSecureCode();
        const data = {
            challenge: d?.challenge,
            token: d?.token,
        }

        axios.patch('http://localhost:8000/api/person/v1/securecodes/' + passcode + '/', data)
        .then((response) => {
            createUser();
        })
        .catch((error) => {
            const errorData = error?.response?.data;
            handleError(errorData);
        });
    }

    /**
     * Handle http
     */
    const handleSubmit = (event) => {
        event.preventDefault();
        validateSecureCode();
    }

    const handleResendSecureCode = (event) => {
        event.preventDefault();
        createSecureCode(true);
    }

    /**
     * Create user
     */
    const createUser = () => {
        const data = {
            msisdn: issuer,
            username: issuer,
            password: password,
            retype_password: password,
            validation: {
                passcode: passcode,
                token: secureCodeData.token,
                challenge: secureCodeData.challenge
            }
        }

        axios.post('http://localhost:8000/api/person/v1/users/', data)
        .then((response) => {
            handleLogin();
        })
        .catch((error) => {
            const errorData = error?.response?.data;
            handleError(errorData);
        });
    }

    /**
     * Login
     */
    const handleLogin = () => {
        const data = {
            username: issuer,
            password: password
        }

        axios.post('http://localhost:8000/api/person/v1/token/', data)
        .then((response) => {
            setCookie('ks-user', response.data);
            setUser(response.data);
            createSuggest(response.data);
        })
        .catch((error) => {
            const errorData = error?.response?.data;
            handleError(errorData);
        });
    }

    /**
    * Create a suggest
    */
    const createSuggest = (u) => {
        const ts = localStorage.getItem('temporary-suggest-' + spread);
        if (ts) {
            const data = {...JSON.parse(ts), spread: spread}
            const config = {}

            if (u?.token) {
                config['headers'] = {
                    'Authorization': 'Bearer ' + u?.token?.access
                }
            }

            axios.post('http://localhost:8000/api/feeder/v1/suggests/', data, config)
                .then((response) => {
                    // save suggest data
                    setCookie('suggest-for-' + spread, JSON.stringify(response.data));

                    // clear cookie
                    removeCookie('temporary-suggest-' + spread);

                    router.replace({
                        pathname: '/success',
                        query: {
                            spread: spread
                        }
                    });
                })
                .catch((error) => {
                    const errorData = error?.response?.data;
                    handleError(errorData);
                });
        }
    }

    return (
        <>
            {loading == 1 &&
                <p className="text-center p-4">Loading... Mohon tunggu</p>
            }
            
            {loading == 0 &&
                <div className="shadow overflow-hidden mx-5">
                    <div className="px-4 py-4 bg-white">
                        <div className="border-b mb-2 pb-2 text-sm">
                            <button type="button" className="bg-blue-500 text-white px-6 py-2 w-full mb-2 flex items-center justify-center" 
                                onClick={() => router.push({pathname: '/signin', query: {spread: spread}})}
                            >
                                Sudah pernah konfirmasi? Klik disini
                            </button>

                            <p>
                                Hadiahnya perlu konfirmasi nomor ponsel<br />
                                Kode keamanan dikirim ke <strong>{ issuer }</strong>
                            </p>

                            <div className="flex w-full items-center mt-3">
                                <div className="text-gray-700 text-xs">
                                    Tunggu 30 detik<br />
                                    Kode belum terkirim?
                                </div>

                                <div className="ml-auto" style={{width: '80px'}}>
                                    <button type="button" className="px-2 py-1 border border-blue-300 bg-blue-200 text-xs w-full" onClick={handleResendSecureCode}>
                                        Kirim Ulang
                                    </button>
                                </div>
                            </div>
                        </div>

                        <form method="POST" onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-800">
                                    Nomor Ponsel *
                                </label>
                                
                                <p className="text-xs text-gray-500">Disensor, pemilik usaha tidak bisa melihatnya</p>
                                <input type="tel" name="phone" value={phone} id="phone" className="mt-1 block w-full border-gray-400 border py-1 px-2 bg-gray-50" placeholder="Mis: 08979614343" onChange={e => setPhone(e.target.value)} required disabled />
                            </div>

                            <div className="mb-3">
                                <label htmlFor="passcode" className="block text-sm font-medium text-gray-800">
                                    Konfirmasi Kode Keamanan *
                                </label>
                                
                                <input type="text" name="passcode" value={passcode} id="passcode" className="mt-1 block w-full border-gray-400 border py-1 px-2 bg-gray-50" placeholder="Mis: IUfg01" onChange={e => setPasscode(e.target.value)} required />
                            </div>

                            <div className="mb-3">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-800">
                                    Buat Password
                                </label>
                                
                                <p className="text-xs text-gray-500">Untuk mengamankan nomor ponsel Anda</p>
                                <input type="text" name="password" value={password} id="password" className="mt-1 block w-full border-gray-400 border py-1 px-2 bg-gray-50" placeholder="Mis: 12346" onChange={e => setPassword(e.target.value)} required />
                                <input type="hidden" name="retype_password" value={password} />
                            </div>

                            <div className="flex w-full items-center">
                                <div className="text-gray-700 text-xs">
                                    Anda mengirim saran sebagai Anonim.
                                </div>

                                <button type="submit" className="bg-red-800 text-white px-6 py-2 ml-auto">Kirim</button>
                            </div>
                        </form>
                    </div>
                </div>
            }
        </>
    )
}

Confirmation.getLayout = function getLayout(page) {
  return (
    <Layout>
      <Navbar />
      {page}
    </Layout>
  )
}