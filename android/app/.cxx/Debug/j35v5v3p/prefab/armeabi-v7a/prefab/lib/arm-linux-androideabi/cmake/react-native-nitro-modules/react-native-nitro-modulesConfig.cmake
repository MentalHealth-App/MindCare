if(NOT TARGET react-native-nitro-modules::NitroModules)
add_library(react-native-nitro-modules::NitroModules SHARED IMPORTED)
set_target_properties(react-native-nitro-modules::NitroModules PROPERTIES
    IMPORTED_LOCATION "/Users/muthuanushya/Documents/FlutterApp/MindCareApp-main/node_modules/react-native-nitro-modules/android/build/intermediates/cxx/Debug/x6e316bc/obj/armeabi-v7a/libNitroModules.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/muthuanushya/Documents/FlutterApp/MindCareApp-main/node_modules/react-native-nitro-modules/android/build/headers/nitromodules"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

