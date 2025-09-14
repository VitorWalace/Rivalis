import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) {
    return 'Data não informada';
  }
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Debug log para verificar dados recebidos
    console.log('formatDate - input:', date, 'type:', typeof date, 'converted:', dateObj);
    
    // Verificar se a data é válida
    if (isNaN(dateObj.getTime())) {
      console.warn('formatDate - Data inválida detectada:', date);
      return 'Data inválida';
    }
    
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(dateObj);
  } catch (error) {
    console.error('Erro ao formatar data:', error, 'Data recebida:', date);
    return 'Data inválida';
  }
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) {
    return 'Data e hora não informadas';
  }
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Verificar se a data é válida
    if (isNaN(dateObj.getTime())) {
      return 'Data e hora inválidas';
    }
    
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  } catch (error) {
    console.error('Erro ao formatar data e hora:', error, 'Data recebida:', date);
    return 'Data e hora inválidas';
  }
}