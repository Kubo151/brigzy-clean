import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  FlatList,
  Pressable,
  TextInput,
} from "react-native";
import { Phone, ChevronDown } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { cn } from "@/lib/cn";
import { COUNTRIES, type Country } from "@/lib/countries";

interface PhoneNumberInputProps {
  selectedCountry: Country | null;
  phoneNumber: string;
  onPhoneNumberChange: (number: string) => void;
  onCountryChange: (country: Country) => void;
  isDark: boolean;
  placeholder?: string;
}

export function PhoneNumberInput({
  selectedCountry,
  phoneNumber,
  onPhoneNumberChange,
  onCountryChange,
  isDark,
  placeholder = "123456789",
}: PhoneNumberInputProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");

  const filteredCountries = COUNTRIES.filter((country) =>
    country.name.toLowerCase().includes(searchText.toLowerCase()) ||
    country.code.toLowerCase().includes(searchText.toLowerCase()) ||
    country.dialCode.includes(searchText)
  );

  const handleSelectCountry = (country: Country) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCountryChange(country);
    setIsModalVisible(false);
    setSearchText("");
  };

  // Format phone number input - allow only digits
  const handlePhoneNumberChange = (text: string) => {
    // Remove all non-digit characters
    const digitsOnly = text.replace(/\D/g, "");
    onPhoneNumberChange(digitsOnly);
  };

  return (
    <>
      <View className="flex-row gap-2 items-stretch">
        {/* Country Code Selector */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsModalVisible(true);
          }}
          className={cn(
            "flex-row items-center border rounded-2xl px-3 gap-2",
            isDark
              ? "bg-zinc-800 border-zinc-700"
              : "bg-white border-gray-200"
          )}
        >
          <Text className="text-lg">{selectedCountry?.flag || "🌍"}</Text>
          <Text
            className={cn(
              "font-medium text-sm",
              isDark ? "text-white" : "text-text-primary"
            )}
          >
            {selectedCountry?.dialCode || "+1"}
          </Text>
          <ChevronDown
            size={16}
            color={isDark ? "#71717A" : "#9CA3AF"}
          />
        </Pressable>

        {/* Phone Number Input */}
        <View
          className={cn(
            "flex-1 flex-row items-center border rounded-2xl px-4",
            isDark
              ? "bg-zinc-800 border-zinc-700"
              : "bg-white border-gray-200"
          )}
        >
          <Phone size={20} color="#7C3AED" />
          <TextInput
            className="flex-1 ml-3 py-3 text-base"
            placeholder={placeholder}
            placeholderTextColor={isDark ? "#71717A" : "#D1D5DB"}
            value={phoneNumber}
            onChangeText={handlePhoneNumberChange}
            keyboardType="phone-pad"
            style={{ color: isDark ? "#fff" : "#000" }}
          />
        </View>
      </View>

      {/* Country Code Selection Modal */}
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
                Select Country Code
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
                placeholder="Search countries or codes..."
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
