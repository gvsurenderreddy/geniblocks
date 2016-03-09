const CircularGlowView = ({color, size, style}) => {
  let radius = size/2,
      colorNoHash = color.replace('#', ''),
      gradientID = `CircularGlowView_${colorNoHash}`,
      gradientIDUrl = `url(#${gradientID})`;

  return (
    <div classNames="geniblocks glow" style={style}>
      <svg width={size+2} height={size+2} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id={gradientID}>
            <stop offset="0%" stopColor={color} stopOpacity="1.0"/>
            <stop offset="100%" stopColor={color} stopOpacity="0.0"/>
          </radialGradient>
        </defs>
        <circle fill={gradientIDUrl} cx={radius} cy={radius} r={radius} />
      </svg>
    </div>
  );
};

CircularGlowView.propTypes = {
  color: React.PropTypes.string.isRequired,
  size: React.PropTypes.number,
  style: React.PropTypes.object
};

export default CircularGlowView;
