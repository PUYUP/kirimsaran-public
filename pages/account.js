import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';
import DataTable from 'react-data-table-component';

import Layout from '../components/layout'
import Navbar from '../components/navbar'

const axios = require('axios');

const columns = [
    {
        name: 'Produk',
        selector: row => row.product_label,
    },
    {
        name: 'Rating',
        selector: row => row.rating,
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
    loadSuggests('http://localhost:8000/api/feeder/v1/suggests/?permit=public');
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

  const ExpandedComponent = ({ data }) => <div className="pt-3">{data?.description}</div>;
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