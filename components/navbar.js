import { useRouter } from 'next/router';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';

export default function Navbar() {
    const router = useRouter();
    const [user, setUser] = useState();
    const [cookies, setCookie, removeCookie] = useCookies();

    useEffect(() => {
        if ('ks-user' in cookies) {
            const u = cookies['ks-user'];
            setUser(u);
        }
    }, []);

    return (
        <>
            <nav className="fixed top-0 inset-x-0 bg-red-800 text-white text-center z-50">
                <div className="py-3 text-lg font-bold">
                    <Link href="/">
                        <a className="block">Kirim Saran</a>
                    </Link>
                </div>

                <Link href="/account">
                    <a className="bg-red-900 py-1 text-xs block">
                        <>Anda memberi saran sebagai Anonim &rarr;</>
                    </a>
                </Link>
            </nav>
        </>
    )
}