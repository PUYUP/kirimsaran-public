import { useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';
import { useRouter } from 'next/router';
import Link from 'next/link';

import Layout from '../components/layout';
import Navbar from '../components/navbar';

function Coupon(props) {
    return (
        <>
            <div className="mb-2 w-full">
                <table className="table-fixed text-sm w-full border border-blue-200 bg-blue-100">
                    <tbody>
                        <tr>
                            <td className="py px-2 pt-1" style={{width: '110px'}}>Kode kupon</td>
                            <td className="pl-2 font-bold py px-2 pt-1">{props.data.identifier}</td>
                        </tr>

                        <Reward data={props.data.reward} />
                    </tbody>
                </table>
            </div>
        </>
    )
}

function Reward(props) {
    return (
        <>
            <tr>
                <td className="py px-2">Diberikan oleh</td>
                <td className="pl-2 py px-2">{props.data.provider}</td>
            </tr>
            <tr>
                <td className="py px-2">Label</td>
                <td className="pl-2 py px-2">{props.data.label}</td>
            </tr>
            <tr>
                <td className="py px-2">Jumlah</td>
                <td className="pl-2 py px-2">
                    {props.data.amount} {props.data.unit_slug} ({props.data.unit_label})
                </td>
            </tr>
            <tr>
                <td colSpan="2" className="pt-2 py px-2">Keterangan</td>
            </tr>
            <tr>
                <td className="py px-2 pt-0" colSpan="2">{props.data.description ? props.data.description : '-'}</td>
            </tr>
                
            <tr>
                <td colSpan="2" className="pt-2 py px-2">Ketentuan</td>
            </tr>
            <tr>
                <td className="py px-2 pt-0 pb-1" colSpan="2">{props.data.term ? props.data.term : '-'}</td>
            </tr>
                    
        </>
    )
}

export default function Success() {
    const router = useRouter();
    const { spread } = router.query;

    const [cookies, setCookie, removeCookie] = useCookies();
    const [suggest, setSuggest] = useState();

    useEffect(() => {
        if (spread) {
            let suggestData = cookies['suggest-for-' + spread];
            setSuggest(suggestData);
        }
    }, [spread]);

    return (
        <>
            <div className="shadow overflow-hidden mx-5">
                <div className="px-4 py-4 bg-white">
                    {suggest?.coupons?.length > 0 && 
                        <>
                            <div className="px-2 py-2 text-sm text-center bg-green-100 border border-green-200 mb-3">
                                <span className="uppercase font-bold">Terima kasih sarannya</span> <br />
                                Tukarkan kupon dibawah ini untuk mendapatkan hadiah
                            </div>

                            {
                                suggest.coupons.map((c, i) => (
                                    <Coupon data={c} key={i} />
                                ))
                            }
                        </>
                    }

                    <Link href="/account">
                        <a className="block bg-yellow-200 px-4 py-2 text-sm text-center border border-yellow-300">
                            Lihat Saran Saya &rarr;
                        </a>
                    </Link>
                </div>
            </div>
        </>
    )
}

Success.getLayout = function getLayout(page) {
  return (
    <Layout>
      <Navbar />
      {page}
    </Layout>
  )
}