package fr.supercoop.app_android;

import android.content.Context;
import android.support.multidex.MultiDex;

import com.actionsheet.ActionSheetPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.horcrux.svg.SvgPackage;
import com.learnium.RNDeviceInfo.RNDeviceInfo;
import com.oblador.keychain.KeychainPackage;
import com.oblador.vectoricons.VectorIconsPackage;
import com.psykar.cookiemanager.CookieManagerPackage;
import com.reactnativecommunity.webview.RNCWebViewPackage;
import com.reactnativenavigation.NavigationApplication;
import com.reactnativenavigation.react.NavigationReactNativeHost;
import com.reactnativenavigation.react.ReactGateway;
import com.zmxv.RNSound.RNSoundPackage;

import org.pgsqlite.SQLitePluginPackage;
import org.reactnative.camera.RNCameraPackage;

import java.util.Arrays;
import java.util.List;


public class MainApplication extends NavigationApplication {
    @Override
    protected void attachBaseContext(Context context) {
        super.attachBaseContext(context);
        MultiDex.install(this);
    }

    @Override
    protected ReactGateway createReactGateway() {
        ReactNativeHost host = new NavigationReactNativeHost(this, isDebug(), createAdditionalReactPackages()) {
            @Override
            protected String getJSMainModuleName() {
                return "index";
            }
        };
        return new ReactGateway(this, isDebug(), host);
    }

    @Override
    public boolean isDebug() {
      return BuildConfig.DEBUG;
    }

    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
        new MainReactPackage(),
            new RNTextInputMaskPackage(),
        new RNDeviceInfo(),
        new RNGoogleSigninPackage(),
        new RNCWebViewPackage(),
        new RNCameraPackage(),
        new RNSentryPackage(),
        new SvgPackage(),
        new KeychainPackage(),
        new RNSoundPackage(),
        new VectorIconsPackage(),
        new SQLitePluginPackage(),
        new ActionSheetPackage(),
        new CookieManagerPackage()
      );
    }

    @Override
    public List<ReactPackage> createAdditionalReactPackages() {
      return getPackages();
    }
}
