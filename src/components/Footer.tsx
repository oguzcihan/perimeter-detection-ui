import classNames from 'classnames';
import { FaHeart } from 'react-icons/fa';

interface FooterProps {
    className?: string;
}

export const Footer = ({ className }: FooterProps) => {
    return (
        <footer className={classNames(
            "w-full py-4 text-center text-sm text-slate-500 font-medium tracking-wide flex justify-center items-center gap-1",
            className
        )}>
            <div className="copyright">
                &copy; {new Date().getFullYear()}, made with{" "}
                <FaHeart className="inline-block text-red-500 mx-1 animate-pulse" /> by OCIHAN
            </div>
        </footer>
    );
};
