if(NOT TARGET hermes-engine::hermesvm)
add_library(hermes-engine::hermesvm SHARED IMPORTED)
set_target_properties(hermes-engine::hermesvm PROPERTIES
    IMPORTED_LOCATION "C:/Users/User/.gradle/caches/9.0.0/transforms/af43ed892430a2df115cea983df4a61d/transformed/jetified-hermes-android-0.82.0-debug/prefab/modules/hermesvm/libs/android.x86/libhermesvm.so"
    INTERFACE_INCLUDE_DIRECTORIES "C:/Users/User/.gradle/caches/9.0.0/transforms/af43ed892430a2df115cea983df4a61d/transformed/jetified-hermes-android-0.82.0-debug/prefab/modules/hermesvm/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

