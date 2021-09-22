import { useRouter } from 'next/router'
import { useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';

import Layout from '../components/layout'
import Navbar from '../components/navbar'

const axios = require('axios');
const Swal = require('sweetalert2');

export default function SignIn() {
    const router = useRouter();
    const { spread } = router.query;

    const [cookies, setCookie, removeCookie] = useCookies(['ksuser']);
    const [loading, setLoading] = useState(1);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [submitLoading, setSubmitLoading] = useState(0);

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
     * Handle http
     */
    const handleSubmit = (event) => {
        event.preventDefault();
        handleLogin();
    }

    /**
     * Login
     */
    const handleLogin = () => {
        setSubmitLoading(1);

        const data = {
            username: username,
            password: password
        }

        axios.post(process.env.apiHost + '/api/person/v1/token/', data)
        .then((response) => {
            setCookie('ks-user', response.data);

            if (spread) {
                createSuggest(response.data);
            } else {
                router.replace({
                    pathname: '/account'
                });
            }
        })
        .catch((error) => {
            const errorData = error?.response?.data;
            handleError(errorData);
            setSubmitLoading(0);
        });
    }

    /**
    * Create a suggest
    */
    const createSuggest = (u) => {
        const ts = localStorage.getItem('temporary-suggest-' + spread);
        if (ts) {
            const parsed = JSON.parse(ts);
            let canals = parsed.canals.map((d) => {
                if (d.method == 'phone') {
                    d = {...d, value: u?.user?.msisdn}
                }

                return d;
            });
            
            const data = {...parsed, canals: canals, spread: spread}
            const config = {}

            if (u?.token) {
                config['headers'] = {
                    'Authorization': 'Bearer ' + u?.token?.access
                }
            }

            axios.post(process.env.apiHost + '/api/feeder/v1/suggests/', data, config)
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
            <div className="shadow overflow-hidden mx-5">
                <div className="px-4 py-4 bg-white">
                    <p className="text-sm border-b pb-2 mb-2">
                        Klaim hadiah memerlukan konfirmasi nomor ponsel untuk memastikan hadiah diberikan kepada Anda. 
                        Jangan khawatir, nomor ponsel tidak diberikan kesiapapun.
                    </p>

                    <form method="POST" onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label htmlFor="username" className="block text-sm font-medium text-gray-800">
                                Nomor Ponsel *
                            </label>
                            
                            <p className="text-xs text-gray-500">Disensor, pemilik usaha tidak bisa melihatnya</p>
                            <input type="tel" name="username" value={username} id="username" className="mt-1 block w-full border-gray-400 border py-1 px-2 bg-gray-50" placeholder="Mis: 08979614343" onChange={e => setUsername(e.target.value)} required />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-800">
                                Password *
                            </label>
                            
                            <p className="text-xs text-gray-500">Masukkan password yang dibuat saat konfirmasi</p>
                            <input type="password" name="password" value={password} id="password" className="mt-1 block w-full border-gray-400 border py-1 px-2 bg-gray-50" placeholder="Mis: 12346" onChange={e => setPassword(e.target.value)} required />
                        </div>

                        <div className="flex w-full items-center">
                            <div className="text-gray-700 text-xs">
                                Anda mengirim saran sebagai Anonim.
                            </div>

                            <button type="submit" className="bg-red-800 text-white px-6 py-2 ml-auto" disabled={submitLoading == 1 ? 'disabled' : ''}>
                                {submitLoading == 1 ? 'Memproses...' : 'Kirim'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <p className="mx-5 text-center mt-5 text-sm">
                Tidak bisa masuk? Hubungi kami untuk bantuan. <br />
                WhatsApp 0811806807
            </p>
        </>
    )
}

SignIn.getLayout = function getLayout(page) {
  return (
    <Layout>
      <Navbar />
      {page}
    </Layout>
  )
}