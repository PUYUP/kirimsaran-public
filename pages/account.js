import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';
import DataTable from 'react-data-table-component';
import { format } from 'date-fns';

import Layout from '../components/layout'
import Navbar from '../components/navbar'

const axios = require('axios');

function Coupon(props) {
    return (
        <>
            <div className="mb-2 w-full">
                <table className="table-fixed text-sm w-full border border-blue-200 bg-blue-100">
                    <tbody>
                        <tr>
                            <td className="py px-2 pt-1" style={{width: '110px'}}>Kode kupon</td>
                            <td className="pl-2 font-bold py px-2 pt-1">
                              {props.data.identifier}
                              {props.data.is_active && 
                                <span className="text-green-700 text-xs py-1 ml-2">Aktif</span>
                              }
                              {props.data.is_used && 
                                <span className="text-red-700 text-xs py-1 ml-2">Digunakan</span>
                              }
                            </td>
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

const renderProduct = (val, row) => {
  let coupons = val.coupons?.map((d) => d.identifier).join(', ');

  return (
    <>
      <div className="block">
        <p className="text-md font-bold">{val.product_label}</p>

        {coupons &&
          <p>Kupon: <span className="text-red-800">{coupons}</span></p>
        }
      </div>
    </>
  )};

const columns = [
    {
        name: 'Produk',
        cell: renderProduct
    },
    {
        name: 'Rating',
        selector: row => row.rating,
        width: '70px'
    },
    {
        name: 'Tanggapan',
        selector: row => row.count_interaction,
        width: '100px'
    },
];

function SuggestsList() {

}

function Suggests(props) {
  const user = props?.user;

  const [data, setData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [prevPage, setPrevPage] = useState(1);
  const [prevUrl, setPrevUrl] = useState('');
  const [nextUrl, setNextUrl] = useState('');

  useEffect(() => {
    loadSuggests(process.env.apiHost + '/api/feeder/v1/suggests/?permit=public');
  }, [user]);

  /**
   * Load suggests
   */
  const loadSuggests = (url) => {
    const config = {}

    if (user?.token) {
      config['headers'] = {
          'Authorization': 'Bearer ' + user?.token?.access
      }

      axios.get(url, config)
        .then((response) => {
          setData(response?.data?.results);
          setTotalRows(response?.data?.total);
          setPrevUrl(response?.data?.previous);
          setNextUrl(response?.data?.next);
        })
        .catch((error) => {
          // pass
      });
    }
  }

  const handlePageChange = (page) => {
    if (prevPage > page) {
      // back
      loadSuggests(prevUrl);
    } else {
      // next
      loadSuggests(nextUrl);
    }

    setPrevPage(page);
	};

  /**
   * Interaction item
   */
  const InteractionItem = (props) => {
    return (
      <>
        <li className="pt-2 mt-2 border-t">
          <p className="font-bold text-sm mb-1">
            {props?.data?.is_product_owner ? 'Pemilik Usaha' : 'Saya'}
            <span className="font-normal ml-3 text-gray-600">
              {format(new Date(props?.data?.create_at), 'dd/MM/yyyy kk:mm')}
            </span>
          </p>
          
          <p>{props?.data?.description}</p>
        </li>
      </>
    )
  }

  /**
   * When expand
   */
  const ExpandedComponent = ({ data }) => {
    const [interactionData, setInteractionData] = useState([]);
    const [loading, setLoading] = useState(0);

    useEffect(() => {
      if (data.count_interaction > 0) {
        loadInteractions(data?.uuid, process.env.apiHost + '/api/feeder/v1/interactions/');
      }
    }, [data]);

    /**
     * Fetch interaction
     */
    const loadInteractions = (suggest, url) => {
      setLoading(1);

      const config = {}

      if (user?.token) {
        config['headers'] = {
            'Authorization': 'Bearer ' + user?.token?.access
        }

        axios.get(url + '?suggest=' + suggest, config)
          .then((response) => {
            setInteractionData(response?.data);
            setLoading(0);
          })
          .catch((error) => {
            // pass
        });
      }
    }

    return (
      <>
        <div className="pt-3 pb-3">
          {data?.description}
        </div>

        {data?.coupons?.length > 0 && 
            <>
                {
                    data.coupons.map((c, i) => (
                        <Coupon data={c} key={i} />
                    ))
                }
            </>
        }

        {(interactionData?.results?.length > 0 && loading == 0) &&
          <>
            <h5 className="uppercase text-xs font-bold mt-2">Tanggapan</h5>
            <ul className="mb-3">
              {
                interactionData.results.map((d, i) => (
                    <InteractionItem data={d} key={i} />
                ))
              }
            </ul>
          </>
        }

        {loading == 1 &&
          <p className="text-sm text-red-600 mb-3">Memuat tanggapan...</p>
        }
      </>
    )
  };

  const paginationComponentOptions = {
    noRowsPerPage: true,
  };

  return (
    <>
      <div className="mx-5 pt-3">
        <h5>Riwayat saran saya</h5>

        <DataTable
          columns={columns}
          data={data}
          expandableRows
          expandableRowsComponent={ExpandedComponent}
          pagination
          paginationComponentOptions={paginationComponentOptions}
			    paginationServer
          paginationTotalRows={totalRows}
          onChangePage={handlePageChange}
          noRowsPerPage='true'
        />
      </div>
    </>
  )
}

export default function Account() {
  const router = useRouter();
  const [cookies, setCookie, removeCookie] = useCookies();

  const [user, setUser] = useState();

  useEffect(() => {
    if ('ks-user' in cookies) {
        const u = cookies['ks-user'];
        setUser(u);
    } else {
      router.replace({
        pathname: '/signin'
      })
    }
  }, []);

  const logout = () => {
    removeCookie('ks-user');

    router.replace({
      pathname: '/signin',
    });
  }

  return (
    <>
      <div className="shadow overflow-hidden mx-5">
        <div className="px-4 py-4 bg-white">
          <table className="text-sm w-full">
            <tbody>
              <tr>
                <td style={{width: '120px'}}>Nomor ponsel</td>
                <td className="pl-2 font-bold text-right">{user?.user?.msisdn}</td>
              </tr>

              <tr>
                <td style={{width: '120px'}}></td>
                <td className="pl-2"></td>
              </tr>
            </tbody>
          </table>

          <p className="border-t pt-2 mt-2">
            Nomor ponsel hanya terlihat oleh Anda. Pemilik usaha yang dikirimi saran tidak bisa melihatnya.
          </p>

          <div className="mt-3">
            <button type="button" className="px-4 py-2 bg-green-300 text-sm" onClick={logout}>
              Ganti Akun
            </button>
          </div>
        </div>
      </div>

      <Suggests user={user} />
    </>
  )
}

Account.getLayout = function getLayout(page) {
  return (
    <Layout>
      <Navbar />
      {page}
    </Layout>
  )
}