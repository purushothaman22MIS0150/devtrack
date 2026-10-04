function Spinner({ text = 'Loading...' }) {
  return (
    <div className="spinner-wrap">
      <div className="spinner"></div>
      <span>{text}</span>
    </div>
  );
}

export default Spinner;