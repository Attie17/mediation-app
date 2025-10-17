import React from 'react';
import UploadsList from './UploadsList';

export default function UploadsTable(props) {
  // You can pass props to UploadsList if needed
  return <UploadsList {...props} />;
}
