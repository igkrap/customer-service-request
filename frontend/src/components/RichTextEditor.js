import React, { useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Box } from '@mui/material';

const RichTextEditor = ({
  value,
  onChange,
  placeholder = '내용을 입력하세요...',
  readOnly = false,
  minHeight = 200
}) => {
  // Configure toolbar modules
  const modules = useMemo(() => ({
    toolbar: readOnly ? false : [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
  }), [readOnly]);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent',
    'color', 'background',
    'align',
    'link', 'image'
  ];

  return (
    <Box
      sx={{
        '& .quill': {
          display: 'flex',
          flexDirection: 'column',
        },
        '& .ql-container': {
          minHeight: `${minHeight}px`,
          fontSize: '14px',
          fontFamily: 'inherit',
          flex: 1,
        },
        '& .ql-editor': {
          minHeight: `${minHeight}px`,
        },
        '& .ql-toolbar': {
          borderTopLeftRadius: '4px',
          borderTopRightRadius: '4px',
          backgroundColor: '#f5f5f5',
        },
        '& .ql-container': {
          borderBottomLeftRadius: '4px',
          borderBottomRightRadius: '4px',
        },
      }}
    >
      <ReactQuill
        theme="snow"
        value={value || ''}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={readOnly}
      />
    </Box>
  );
};

export default RichTextEditor;
