import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  FlatList,
  Pressable,
  TextInput,
} from "react-native";
import { ChevronDown } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { cn } from "@/lib/cn";
import { COUNTRIES, type Country } from "@/lib/countries";

interface CountrySelectorProps {
  selectedCountry: Country | null;
  onCountrySelect: (country: Country) => void;
  isDark: boolean;
  placeholder?: string;
}

export function CountrySelector({
  selectedCountry,
  onCountrySelect,
  isDark,
  placeholder = "Select Country",
}: CountrySelectorProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");

  const filteredCountries = COUNTRIES.filter((country) =>
    country.name.toLowerCase().includes(searchText.toLowerCase()) ||
    country.code.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleSelectCountry = (country: Country) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCountrySelect(country);
    setIsModalVisible(false);
    setSearchText("");
  };

  return (
    <>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setIsModalVisible(true);
        }}
        className={cn(
          "flex-row items-center border rounded-2xl px-4 py-3",
          isDark
            ? "bg-zinc-800 border-zinc-700"
            : "bg-white border-gray-200"
        )}
      >
        <Text className="text-2xl mr-3">
          {selectedCountry?.flag || "🌍"}
        </Text>
        <View className="flex-1">
          <Text
            className={cn(
              "text-base",
              selectedCountry
                ? isDark
                  ? "text-white"
                  : "text-text-primary"
                : isDark
                ? "text-zinc-500"
                : "text-text-muted"
            )}
          >
            {selectedCountry?.name || placeholder}
          </Text>
        </View>
        <ChevronDown
          size={20}
          color={isDark ? "#71717A" : "#9CA3AF"}
        />
      </Pressable>

      {/* Country Selection Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setIsModalVisible(false);
          setSearchText("");
        }}
      >
        <Pressable
          className="flex-1 bg-black/50 items-center justify-end"
          onPress={() => {
            setIsModalVisible(false);
            setSearchText("");
          }}
        >
          <Pressable
            className={cn(
              "w-full rounded-t-3xl max-h-4/5 p-6",
              isDark ? "bg-zinc-800" : "bg-white"
            )}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View className="mb-4">
              <Text
                className={cn(
                  "text-2xl font-bold",
                  isDark ? "text-white" : "text-text-primary"
                )}
              >
                Select Country
              </Text>
            </View>

            {/* Search */}
            <View
              className={cn(
                "flex-row items-center border rounded-2xl px-4 mb-4",
                isDark
                  ? "bg-zinc-700 border-zinc-600"
                  : "bg-gray-100 border-gray-200"
              )}
            >
              <TextInput
                className="flex-1 py-3 text-base"
                placeholder="Search countries..."
                placeholderTextColor={isDark ? "#71717A" : "#D1D5DB"}
                value={searchText}
                onChangeText={setSearchText}
                autoCapitalize="none"
                style={{ color: isDark ? "#fff" : "#000" }}
              />
            </View>

            {/* Country List */}
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code}
              scrollEnabled
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleSelectCountry(item)}
                  className={cn(
                    "flex-row items-center p-4 rounded-2xl mb-2",
                    selectedCountry?.code === item.code
                      ? "bg-primary"
                      : isDark
                      ? "bg-zinc-700"
                      : "bg-gray-100"
                  )}
                >
                  <Text className="text-2xl mr-3">{item.flag}</Text>
                  <View className="flex-1">
                    <Text
                      className={cn(
                        "font-medium",
                        selectedCountry?.code === item.code
                          ? "text-white"
                          : isDark
                          ? "text-white"
                          : "text-gray-900"
                      )}
                    >
                      {item.name}
                    </Text>
                    <Text
                      className={cn(
                        "text-sm",
                        selectedCountry?.code === item.code
                          ? "text-white/70"
                          : isDark
                          ? "text-zinc-500"
                          : "text-gray-500"
                      )}
                    >
                      {item.dialCode}
                    </Text>
                  </View>
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
