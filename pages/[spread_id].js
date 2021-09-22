import { useRouter } from 'next/router'
import { useEffect, useState } from 'react';
import ReactStars from 'react-rating-stars-component'
import { useCookies } from 'react-cookie';

import Layout from '../components/layout'
import Navbar from '../components/navbar'

const axios = require('axios');
const Swal = require('sweetalert2');

function Reward(props) {
    return (
        <>
            <div className="mb-2 bg-green-100 w-full p-3 border border-green-200">
                <table className="table-fixed text-sm w-full">
                    <tbody>
                        <tr>
                            <td style={{width: '110px'}}>Diberikan oleh</td>
                            <td className="pl-2">{props.data.provider}</td>
                        </tr>
                        <tr>
                            <td>Nama</td>
                            <td className="pl-2">{props.data.label}</td>
                        </tr>
                        <tr>
                            <td>Jumlah</td>
                            <td className="pl-2">
                                {props.data.amount} {props.data.unit_slug} ({props.data.unit_label})
                            </td>
                        </tr>
                        <tr>
                            <td colSpan="2" className="font-semibold pt-3">Keterangan</td>
                        </tr>
                        <tr>
                            <td colSpan="2">{props.data.description ? props.data.description : '-'}</td>
                        </tr>
                            
                        <tr>
                            <td colSpan="2" className="font-semibold pt-3">Ketentuan</td>
                        </tr>
                        <tr>
                            <td colSpan="2">{props.data.term ? props.data.term : '-'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </>
    )
}

export default function Spread() {
  const router = useRouter();
  const { spread_id } = router.query;

  const [cookies, setCookie, removeCookie] = useCookies();
  const [hasReward, setHasReward] = useState(false);
  const [showReward, setShowReward] = useState(0);
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState(0);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [spreadData, setSpreadData] = useState({ 
      content_object_label: 'loading',
      content_object_uuid: '',
      identifier: '',
      rewards: [],
      product: ''
  });
  const [user, setUser] = useState();
  const [submitLoading, setSubmitLoading] = useState(0);
  const [showIntroduction, setShowIntroduction] = useState(0);

  useEffect(() => {
    if (spread_id) {
        getSpread();

        if ('ks-user' in cookies) {
            const u = cookies['ks-user'];
    
            setUser(u);

            setTimeout(() => {
                setPhone(u?.user?.msisdn);
            }, 1000);
        }
    }
  }, [spread_id]);

  const ratingChanged = (newRating) => {
      setRating(newRating);
  };

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
   * Check data
   */
  const suggestedData = () => {

  }

  /**
   * Build data
   */
  const handleSubmit = (event) => {
    event.preventDefault();

    if (!description) {
      alert("Saran tidak boleh kosong");
      return;
    }

    if (!rating) {
      alert("Rating tidak boleh kosong");
      return;
    }

    let data = {
      description: description,
      rating: rating,
      canals: []
    }

    if (phone) {
      let pn = {
        method: 'phone',
        value: phone
      }

      data['canals'].push(pn);
    }

    if (email) {
      let em = {
        method: 'email',
        value: email
      }

      data['canals'].push(em);
    }

    // prevent send if has rewards
    if (spreadData?.rewards?.length > 0 && !user?.token) {
        let method = data.canals.find((d) => d.method == 'phone');

        router.push({
            pathname: '/confirmation',
            query: {
                issuer: method.value,
                spread: spread_id
            }
        });

        // save temporary suggest
        localStorage.setItem('temporary-suggest-' + spread_id, JSON.stringify(data));

        return;
    }

    createSuggest(data);
  };

  /**
   * Send data to server
   */
  const createSuggest = (data) => {
    setSubmitLoading(1);

    data = {...data, spread: spread_id}

    const config = {}

    if (user?.token) {
        config['headers'] = {
            'Authorization': 'Bearer ' + user?.token?.access
        }
    }

    axios.post(process.env.apiHost + '/api/feeder/v1/suggests/', data, config)
      .then((response) => {
        // save suggest data
        setCookie('suggest-for-' + spread_id, JSON.stringify(response.data));
        setSubmitLoading(0);

        router.replace({
            pathname: '/success',
            query: {
                spread: spread_id
            }
        });
      })
      .catch((error) => {
        const errorData = error?.response?.data;
        handleError(errorData);
        setSubmitLoading(0);
      });
  }

  const getSpread = async () => {
      await axios.get(process.env.apiHost + '/api/feeder/v1/spreads/' + spread_id + '/',
        { 
            withCredentials: true 
        })
        .then((response) => {
            const data = response.data;

            setSpreadData({...data});

            if (data.rewards.length > 0) {
                setHasReward(true);
            }
        })
        .catch((error) => {
            const errorData = error?.response?.data;
            handleError(errorData);
        })
  }

  return (
    <>
        {spreadData?.content_object_label == 'loading' &&
        <p className="text-center p-4">Loading... Mohon tunggu</p>
        }

        {spreadData?.content_object_label != 'loading' &&
        <form onSubmit={handleSubmit} method="POST">
            <div className="shadow overflow-hidden mx-5">
                <div className="px-4 py-4 bg-white">
                    <div className="border-b mb-2 pb-2 text-sm">
                        <div className="flex w-full">
                            <div>
                                <span className="pr-2">Saran untuk</span>
                                <strong>{ spreadData.product }</strong>
                            </div>

                            {spreadData?.introduction &&
                                <div className="pl-2 ml-auto">
                                    {showIntroduction == 0 &&
                                        <button type="button" className="bg-blue-200 text-xs border border-blue-300 px-2 py-1" onClick={() => setShowIntroduction(1)}>
                                            Baca Pengantar
                                        </button>
                                    }

                                    {showIntroduction == 1 &&
                                        <button type="button" className="bg-red-200 text-xs border border-red-300 px-2 py-1" onClick={() => setShowIntroduction(0)}>
                                            Tutup Pengantar
                                        </button>
                                    }
                                </div>
                            }
                        </div>

                        {showIntroduction == 1 &&
                            <>
                                <div className="bg-blue-100 border border-blue-200 p-3 mt-3">
                                    {spreadData?.introduction}
                                </div>
                            </>
                        }
                    </div>

                    {(showReward == 0 && spreadData.rewards.length > 0) &&
                        <button type="button" className="bg-green-400 text-white px-6 py-2 w-full mb-2 flex items-center justify-center" onClick={() => setShowReward((1))}>
                            <span className="animate-bounce">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z" clipRule="evenodd" />
                                <path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" />
                                </svg>
                            </span>

                            <span className="ml-2 text-sm">Lihat hadiah!</span>
                        </button>
                    }

                    {(showReward == 1 && spreadData.rewards.length > 0) &&
                        <div className="w-full">
                            {
                                spreadData.rewards.map((reward, i) => (
                                    <Reward data={reward} key={i} />
                                ))
                            }

                            {!user?.token &&
                                <div className="bg-yellow-200 p-3 text-sm">
                                    <p>Klaim hadiah perlu verifikasi nomor ponsel untuk mencegah 1 orang mengklaim berulang kali.</p>
                                </div>
                            }

                            <button type="button" className="bg-gray-400 text-white px-6 py-2 w-full mb-2 flex items-center justify-center" onClick={() => setShowReward((0))}>
                                <span className="ml-2">Tutup</span>
                            </button>
                        </div>
                    }

                    <div className="mb-3">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-800">Saran Saya *</label>
                        <textarea name="description" value={description} id="description" className="mt-1 block w-full border-gray-400 border py-1 px-2 bg-gray-50" rows="3" required onChange={e => setDescription(e.target.value)}></textarea>
                    </div>

                    <div className="mb-3 rating">
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-800">
                            Rating *
                        </label>

                        <ReactStars
                            count={5}
                            onChange={ratingChanged}
                            size={34}
                            activeColor="#fabb05"
                            value={rating}
                        />
                    </div>
                    
                    {!user?.token &&
                        <>
                            <div className="mb-3">
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-800">
                                    Nomor Ponsel {hasReward ? '*' : ''}
                                </label>
                                
                                <p className="text-xs text-gray-500">Disensor, pemilik usaha tidak bisa melihatnya</p>
                                <input type="tel" name="phone" value={phone} id="phone" className="mt-1 block w-full border-gray-400 border py-1 px-2 bg-gray-50" placeholder="Mis: 08979614343" onChange={e => setPhone(e.target.value)} required={hasReward ? true : false} />
                            </div>
                            
                            <div className="mb-4 hidden">
                                <label htmlFor="email" className="block text-sm font-medium text-gray-800">
                                    Alamat Email
                                </label>
                                
                                <p className="text-xs text-gray-500">Disensor, pemilik usaha tidak bisa melihatnya</p>
                                <input type="email" name="email" value={email} id="email" className="mt-1 block w-full border-gray-400 border py-1 px-2 bg-gray-50" placeholder="Mis: joker@email.com" onChange={e => setEmail(e.target.value)} />
                            </div>
                        </>
                    }

                    <div className="flex w-full items-center">
                        <div className="text-gray-700 text-xs pr-3">
                            Anda memberi saran sebagai Anonim.
                        </div>

                        <button type="submit" className="bg-red-800 text-white px-6 py-2 ml-auto" disabled={submitLoading == 1 ? 'disabled' : ''}>
                            {submitLoading == 1 ? 'Memproses...' : 'Kirim'}
                        </button>
                    </div>
                </div>
            </div>
        </form>
        }
    </>
  )
}

Spread.getLayout = function getLayout(page) {
  return (
    <Layout>
      <Navbar />
      {page}
    </Layout>
  )
}