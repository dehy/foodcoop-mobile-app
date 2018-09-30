import React, {Component} from 'react';
import {StyleSheet, Text, View, Image, Button, Alert} from 'react-native';
import { goHome } from './navigation';

export default class Welcome extends Component {
  _onGoogleSignInTap() {
    console.log('user successfully signed in!')
    goHome()
  }

  render() {
    return (
      <View style={styles.container}>
        <Image source={require('../assets/images/welcome_supercoop.png')} />
        <Text style={styles.welcome}>Bienvenue, Supercoopain•ine !</Text>
        <Text style={styles.instructions}>
          Pour commencer à utiliser l'application, connectes-toi à ton compte Supercoop
          grâce au bouton ci-dessous. Tu auras besoin de tes identifiants Google Supercoop.
          On se retrouve juste après !
        </Text>
        <Button
          onPress={this._onGoogleSignInTap}
          title="Google Sign In"
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  welcome: {
    fontSize: 30,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginTop: 40,
    marginRight: 20,
    marginBottom: 40,
    marginLeft: 20
  },
});
