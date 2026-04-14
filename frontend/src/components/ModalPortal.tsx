import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalPortalProps {
  children: React.ReactNode;
}

const ModalPortal: React.FC<ModalPortalProps> = ({ children }) => {
  const el = useRef(document.createElement('div'));

  useEffect(() => {
    const portalRoot = document.body;
    portalRoot.appendChild(el.current);
    return () => {
      portalRoot.removeChild(el.current);
    };
  }, []);

  return createPortal(children, el.current);
};

export default ModalPortal;
