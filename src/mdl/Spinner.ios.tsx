/**
 * MDL style Spinner component.
 *
 * Refer to {@link http://www.getmdl.io/components/index.html#loading-section/spinner | MDL Spinner}
 *
 * Created by ywu on 15/8/14.
 */
import React, { Component } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  RotateTransform,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';

import MKColor from '../MKColor';
import { getTheme, Theme } from '../theme';
import { defaultProps, SpinnerProps, SpinnerState } from './spinner_common';

// controlling speed of rotation: percent to degree
const SPINNER_ROTATE_INTERP = {
  inputRange: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1],
  outputRange: [
    '0deg',
    '45deg',
    '90deg',
    '135deg',
    '180deg',
    '225deg',
    '270deg',
    '315deg',
    '360deg',
  ],
};

const L_ARC_ROTATE_INTERP = {
  inputRange: [0, 0.5, 1],
  outputRange: ['130deg', '-5deg', '130deg'],
};

const R_ARC_ROTATE_INTERP = {
  inputRange: [0, 0.5, 1],
  outputRange: ['-130deg', '5deg', '-130deg'],
};

/**
 * The default `Spinner` component.
 *
 * @remarks
 * See {@link SpinnerProps} for the available props.
 *
 * Refer to {@link https://material.io/design/components/progress-indicators.html# | Guideline} or {@link http://www.getmdl.io/components/index.html#loading-section/spinner | MDL implementation}
 */
export default class Spinner extends Component<SpinnerProps, SpinnerState> {
  /** Default props of {@link Spinner} */
  static defaultProps: SpinnerProps = defaultProps;

  /** Reference to App's {@link Theme} */
  private theme: Theme = getTheme();

  private _nextStrokeColorIndex = 0;
  private _animatedContainerAngle = new Animated.Value(0);
  private _animatedArcAngle = new Animated.Value(0);

  constructor(props: SpinnerProps) {
    super(props);
    this.state = {
      dimen: {
        height: 0,
        width: 0,
      },
      strokeColor: this.theme.primaryColor,
    };
  }

  /** {@inheritDoc @types/react#Component.render} */
  render() {
    return (
      <Animated.View // the container layer
        style={[
          {
            transform: [
              { rotate: this._animatedContainerAngle.interpolate(SPINNER_ROTATE_INTERP) },
            ],
          },
          defaultProps.style,
          this.props.style,
        ]}
        onLayout={this._onLayout}
      >
        {this._renderSpinnerLayer(true) /* spinner-left */}
        {this._renderSpinnerLayer(false) /* spinner-right */}
      </Animated.View>
    );
  }

  // property initializers begin
  private _onLayout = ({
    nativeEvent: {
      layout: { width, height },
    },
  }: LayoutChangeEvent) => {
    if (width > 0 && this.state.dimen.width !== width) {
      this.setState({ dimen: { width, height } }, this._aniUpdateSpinner);
    }
  };

  // rotation & arc animation
  private _aniUpdateSpinner = () => {
    const { width, height } = this.state.dimen;
    if (!width || !height) {
      return;
    }

    const duration = this.props.spinnerAniDuration || 1500;
    this._animatedContainerAngle.setValue(0);
    this._animatedArcAngle.setValue(0);

    this._updateStrokeColor(() => {
      Animated.parallel([
        Animated.timing(this._animatedContainerAngle, {
          duration,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(this._animatedArcAngle, {
          duration,
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => finished && setImmediate(this._aniUpdateSpinner));
    });
  };
  // property initializers end

  // render the specified part (left or right) of the arc
  private _renderSpinnerLayer(left: boolean) {
    const { width, height } = this.state.dimen;
    const radii = width / 2;
    const arcStyle: StyleProp<ViewStyle> = {
      height,
      width,

      borderBottomColor: MKColor.Transparent,
      borderColor: this.state.strokeColor,
      borderRadius: radii,
      borderWidth: this.props.strokeWidth || 3,
      position: 'absolute',
    };

    if (!width || !height) {
      return undefined;
    }

    let arcInterpolate;
    if (left) {
      arcInterpolate = L_ARC_ROTATE_INTERP;
      arcStyle.borderRightColor = MKColor.Transparent;
    } else {
      arcInterpolate = R_ARC_ROTATE_INTERP;
      arcStyle.right = 0;
      arcStyle.borderLeftColor = MKColor.Transparent;
    }

    arcStyle.transform = [
      { rotate: this._animatedArcAngle.interpolate(arcInterpolate) as any } as RotateTransform,
    ];

    return (
      <View // the clipper layer
        style={{
          height,
          width: radii,

          left: left ? 0 : radii,
          overflow: 'hidden',
          position: 'absolute',
        }}
      >
        <Animated.View // the arc
          style={arcStyle}
        />
      </View>
    );
  }

  private _updateStrokeColor(cb: () => void) {
    // @ts-ignore
    const colors = this.props.strokeColor || this.theme.spinnerStyle.strokeColor;
    let nextColor;

    if (Array.isArray(colors)) {
      const index = this._nextStrokeColorIndex % colors.length || 0;
      this._nextStrokeColorIndex = index + 1;
      nextColor = colors[index];
    } else {
      nextColor = colors;
    }

    this.setState({ strokeColor: nextColor || this.theme.primaryColor }, cb);
  }
}
